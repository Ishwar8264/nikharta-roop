import "server-only";

import {
  AVATAR_UPLOAD_LIMIT_BYTES,
  AVATAR_UPLOAD_TYPES,
  getAvatarEagerTransformations,
  getCloudinaryConfig,
} from "@/features/media/config/cloudinary.config";
import { signCloudinaryParams } from "@/features/media/helpers/cloudinary-signature";
import type { MediaUploaderItem } from "@/features/media/types/media-uploader.types";

// Builds signed upload data for one user's avatar folder.
export function createAvatarUploadSignature(userId: string, fileHash?: string) {
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = getAvatarFolder(userId);
  // Hash-based public ids make repeated uploads of the same file overwrite safely.
  const safeHash = getSafeFileHash(fileHash);
  const publicId = safeHash ? `avatar-${safeHash}` : `avatar-${timestamp}`;
  const eager = getAvatarEagerTransformations();
  const signature = signCloudinaryParams(
    { eager, folder, public_id: publicId, timestamp },
    config.apiSecret,
  );

  return {
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    eager,
    folder,
    maxBytes: AVATAR_UPLOAD_LIMIT_BYTES,
    publicId,
    signature,
    timestamp,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    uploadTypes: AVATAR_UPLOAD_TYPES,
  };
}

// Reads already uploaded avatar assets from Cloudinary.
export async function listAvatarCloudinaryItems(userId: string) {
  const config = getCloudinaryConfig();
  const url = new URL(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image/upload`,
  );

  url.searchParams.set("max_results", "50");
  url.searchParams.set("prefix", `${getAvatarFolder(userId)}/`);

  const response = await fetch(url, { headers: getAdminAuthHeaders(config) });
  const payload = (await response.json().catch(() => null)) as
    | CloudinaryResourcePayload
    | null;

  if (!response.ok) throw new Error("Could not load avatar media.");

  return payload?.resources?.map(toMediaItem) ?? [];
}

type CloudinaryResourcePayload = {
  resources?: Array<{ public_id: string; secure_url: string }>;
};

function getAdminAuthHeaders(config: { apiKey: string; apiSecret: string }) {
  const token = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");

  return { authorization: `Basic ${token}` };
}

// Keep every user's avatar media isolated inside their own Cloudinary folder.
function getAvatarFolder(userId: string) {
  return `nikharta-roop/users/${userId}/avatar`;
}

// Reject anything that is not our client-side SHA hash shape.
function getSafeFileHash(fileHash?: string) {
  return /^[a-f0-9]{16,64}$/.test(fileHash ?? "") ? fileHash : null;
}

// Normalize Cloudinary resources into the generic media picker contract.
function toMediaItem(resource: { public_id: string; secure_url: string }): MediaUploaderItem {
  return {
    id: resource.public_id,
    name: resource.public_id.split("/").pop() ?? "Avatar",
    url: toAvatarPreviewUrl(resource.secure_url),
  };
}

// Library thumbnails should match the same face-cropped avatar shape as uploads.
function toAvatarPreviewUrl(url: string) {
  return url.replace("/upload/", "/upload/c_fill,g_face,w_240,h_240,q_auto/");
}
