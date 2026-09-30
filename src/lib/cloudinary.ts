import "server-only";

import { createHash } from "node:crypto";

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
