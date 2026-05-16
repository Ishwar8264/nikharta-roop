import "server-only";

export const AVATAR_UPLOAD_LIMIT_BYTES = 2 * 1024 * 1024;
export const AVATAR_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type CloudinaryConfig = {
  apiKey: string;
  apiSecret: string;
  cloudName: string;
};

// Reads Cloudinary credentials once per request path and fails closed.
export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary avatar upload is not configured.");
  }

  return {
    apiKey,
    apiSecret,
    cloudName,
  };
}

// Server-owned transformations keep avatar sizing consistent across clients.
export function getAvatarEagerTransformations() {
  return [
    "c_fill,g_face,w_240,h_240,q_auto",
    "c_fill,g_face,w_100,h_100,q_auto",
  ].join("|");
}
