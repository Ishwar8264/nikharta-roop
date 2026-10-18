import "server-only";

import { createHash } from "node:crypto";

export function signCloudinaryParameters(
  parameters: Record<string, string | number | boolean>,
) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) throw new Error("Cloudinary is not configured");
  return createHash("sha1")
    .update(
      Object.entries(parameters)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("&") + secret,
    )
    .digest("hex");
}

/** Query Cloudinary itself; client-provided metadata is never proof of an upload. */
export async function getAuthenticatedCloudinaryImage(publicId: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret)
    throw new Error("Cloudinary is not configured");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/resources/image/authenticated/${encodeURIComponent(publicId)}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error("Could not verify the private upload. Please try again.");
  return (await response.json()) as {
    public_id: string;
    secure_url: string;
    type: string;
    resource_type: string;
    bytes: number;
    format: string;
    width: number;
    height: number;
  };
}

/** Expiring original-file download, generated only after application authorization. */
export function privateVerificationDownload(publicId: string) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  if (!cloud || !key) throw new Error("Cloudinary is not configured");
  const timestamp = Math.floor(Date.now() / 1000);
  const parameters = {
    public_id: publicId,
    type: "authenticated",
    attachment: false,
    timestamp,
    expires_at: timestamp + 60,
  };
  const query = new URLSearchParams(
    Object.entries(parameters).map(([key, value]) => [key, String(value)]),
  );
  query.set("api_key", key);
  query.set("signature", signCloudinaryParameters(parameters));
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/download?${query}`;
}

/**
 * Signed Cloudinary deletion.
 *
 * Why no SDK package:
 * The official `cloudinary` package drags in ~40 transitive deps and its
 * Node build targets CommonJS. Deletion is a single authenticated POST —
 * implementing it with fetch keeps our bundle honest and our runtime Edge
 * compatible if we ever move this code.
 *
 * Signature format (documented by Cloudinary):
 *   sha1(sorted_params + api_secret)
 * The params are joined with `&` and sorted alphabetically, same as the
 * upload signature.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  const body = new URLSearchParams({
    public_id: publicId,
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary delete failed: ${res.status} ${text}`);
  }
}
