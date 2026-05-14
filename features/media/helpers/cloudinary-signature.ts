import "server-only";

import { createHash } from "node:crypto";

// Cloudinary signs sorted non-empty params as query pairs plus API secret.
export function signCloudinaryParams(
  params: Record<string, number | string | undefined>,
  apiSecret: string,
) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}
