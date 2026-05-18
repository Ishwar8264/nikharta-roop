/**
 * Purpose: Server helpers for service image Cloudinary signing and library reads.
 * Responsibilities: create signed upload contracts and list existing service images.
 * Important notes: callers must authenticate before using these helpers because they expose upload capability.
 */
import "server-only";

import {
  SERVICE_IMAGE_UPLOAD_LIMIT_BYTES,
  SERVICE_IMAGE_UPLOAD_TYPES,
  getCloudinaryConfig,
  getServiceImageEagerTransformations,
} from "@/features/media/config/cloudinary.config";
import { signCloudinaryParams } from "@/features/media/helpers/cloudinary-signature";
import type { MediaUploaderItem } from "@/features/media/types/media-uploader.types";

/**
 * Builds signed upload data for the shared service media folder.
 */
export function createServiceImageUploadSignature(fileHash?: string) {
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = getServiceImageFolder();
  const safeHash = getSafeFileHash(fileHash);
  const publicId = safeHash ? `service-${safeHash}` : `service-${timestamp}`;
  const eager = getServiceImageEagerTransformations();
  const signature = signCloudinaryParams(
    { eager, folder, public_id: publicId, timestamp },
    config.apiSecret,
  );

  return {
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    eager,
    folder,
    maxBytes: SERVICE_IMAGE_UPLOAD_LIMIT_BYTES,
    publicId,
    signature,
    timestamp,
    uploadTypes: SERVICE_IMAGE_UPLOAD_TYPES,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
  };
}

/**
 * Lists existing service images so admins can reuse catalog media.
 */
export async function listServiceImageCloudinaryItems() {
  const config = getCloudinaryConfig();
  const url = new URL(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image/upload`,
  );

  url.searchParams.set("max_results", "80");
  url.searchParams.set("prefix", `${getServiceImageFolder()}/`);

  const response = await fetch(url, { headers: getAdminAuthHeaders(config) });
  const payload = (await response.json().catch(() => null)) as
    | CloudinaryResourcePayload
    | null;

  if (!response.ok) throw new Error("Could not load service media.");

  return payload?.resources?.map(toMediaItem) ?? [];
}

type CloudinaryResourcePayload = {
  resources?: Array<{ public_id: string; secure_url: string }>;
};

/**
 * Creates Cloudinary Admin API basic auth headers.
 */
function getAdminAuthHeaders(config: { apiKey: string; apiSecret: string }) {
  const token = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");

  return { authorization: `Basic ${token}` };
}

/**
 * Keeps catalog imagery grouped away from user-owned avatar folders.
 */
function getServiceImageFolder() {
  return "nikharta-roop/services";
}

/**
 * Accepts only client SHA hashes for public ids.
 */
function getSafeFileHash(fileHash?: string) {
  return /^[a-f0-9]{16,64}$/.test(fileHash ?? "") ? fileHash : null;
}

/**
 * Converts Cloudinary resources into the generic media picker contract.
 */
function toMediaItem(resource: { public_id: string; secure_url: string }): MediaUploaderItem {
  return {
    id: resource.public_id,
    name: resource.public_id.split("/").pop() ?? "Service image",
    url: toServicePreviewUrl(resource.secure_url),
  };
}

/**
 * Normalizes library thumbnails to the same catalog image dimensions as uploads.
 */
function toServicePreviewUrl(url: string) {
  return url.replace("/upload/", "/upload/c_fill,w_900,h_650,q_auto/");
}
