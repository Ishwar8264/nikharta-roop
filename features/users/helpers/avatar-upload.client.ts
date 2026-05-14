import type { AvatarUploadSignatureState } from "@/features/users/actions/avatar-upload.actions";

type CloudinaryUploadPayload = {
  eager?: Array<{
    secure_url?: string;
  }>;
  error?: {
    message?: string;
  };
  secure_url?: string;
};

export type AvatarUploadResult = {
  avatarUrl: string;
};

// Stable content hash lets Cloudinary reuse the same public_id for duplicates.
export async function createAvatarFileHash(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  // Short hash is enough for stable public ids while keeping Cloudinary names readable.
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

// Client-side guard avoids sending invalid files to Cloudinary.
export function validateAvatarFile(
  file: File,
  allowedTypes: string[],
  maxBytes: number,
) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Upload JPG, PNG, or WebP image only.");
  }

  if (file.size > maxBytes) {
    throw new Error("Avatar image must be 2MB or smaller.");
  }
}

// Uploads directly to Cloudinary using a server-signed contract.
export async function uploadAvatarToCloudinary(
  file: File,
  signature: Extract<AvatarUploadSignatureState, { success: true }>,
): Promise<AvatarUploadResult> {
  const formData = new FormData();

  // Only signed fields from the server are sent with the user-selected file.
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

  // Prefer the eager avatar transform so saved URLs render consistently.
  const avatarUrl = payload.eager?.[0]?.secure_url ?? payload.secure_url;

  if (!avatarUrl) {
    throw new Error("Cloudinary did not return an avatar URL.");
  }

  return {
    avatarUrl,
  };
}
