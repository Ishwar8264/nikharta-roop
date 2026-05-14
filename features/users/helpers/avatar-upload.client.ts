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

// Uploads directly to Cloudinary using a server-signed contract.
export async function uploadAvatarToCloudinary(
  file: File,
  signature: Extract<AvatarUploadSignatureState, { success: true }>,
): Promise<AvatarUploadResult> {
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

  const avatarUrl = payload.eager?.[0]?.secure_url ?? payload.secure_url;

  if (!avatarUrl) {
    throw new Error("Cloudinary did not return an avatar URL.");
  }

  return {
    avatarUrl,
  };
}
