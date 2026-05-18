/**
 * Purpose: Client helpers for uploading service images through signed Cloudinary requests.
 * Responsibilities: hash files, validate media type/size, and return service image URLs to the media picker.
 * Important notes: signing stays server-side; this file only sends files to Cloudinary with a short-lived contract.
 */
import type { ServiceUploadSignatureState } from "@/features/services/actions/service-media.actions";

type CloudinaryUploadPayload = {
  eager?: Array<{
    secure_url?: string;
  }>;
  error?: {
    message?: string;
  };
  secure_url?: string;
};

export type ServiceImageUploadResult = {
  imageUrl: string;
};

/**
 * Creates a stable short hash so repeated uploads can reuse predictable public ids.
 */
export async function createServiceImageFileHash(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Blocks invalid service media before the browser sends large files to Cloudinary.
 */
export function validateServiceImageFile(
  file: File,
  allowedTypes: string[],
  maxBytes: number,
) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Upload JPG, PNG, or WebP image only.");
  }

  if (file.size > maxBytes) {
    throw new Error("Service image must be 4MB or smaller.");
  }
}

/**
 * Uploads a service image directly to Cloudinary with server-signed fields.
 */
export async function uploadServiceImageToCloudinary(
  file: File,
  signature: Extract<ServiceUploadSignatureState, { success: true }>,
): Promise<ServiceImageUploadResult> {
  const formData = new FormData();

  formData.set("api_key", signature.apiKey);
  formData.set("eager", signature.eager);
  formData.set("file", file);
  formData.set("folder", signature.folder);
  formData.set("public_id", signature.publicId);
  formData.set("signature", signature.signature);
  formData.set("timestamp", String(signature.timestamp));

  const response = await fetch(signature.uploadUrl, {
    body: formData,
    method: "POST",
  });
  const payload = (await response.json()) as CloudinaryUploadPayload;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Cloudinary upload failed.");
  }

  const imageUrl = payload.eager?.[0]?.secure_url ?? payload.secure_url;

  if (!imageUrl) {
    throw new Error("Cloudinary did not return a service image URL.");
  }

  return { imageUrl };
}
