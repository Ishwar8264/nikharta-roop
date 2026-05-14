"use server";

import { getCurrentUserFromRequest } from "@/features/auth/helpers/auth-session.server";
import {
  AVATAR_UPLOAD_LIMIT_BYTES,
  AVATAR_UPLOAD_TYPES,
  getAvatarEagerTransformations,
  getCloudinaryConfig,
} from "@/features/media/config/cloudinary.config";
import { signCloudinaryParams } from "@/features/media/helpers/cloudinary-signature";

export type AvatarUploadSignatureState =
  | {
      message: string;
      success: false;
    }
  | {
      apiKey: string;
      cloudName: string;
      eager: string;
      folder: string;
      maxBytes: number;
      message: string;
      publicId: string;
      signature: string;
      success: true;
      timestamp: number;
      uploadUrl: string;
      uploadTypes: string[];
    };

// Creates a short-lived signed Cloudinary upload contract for this user.
export async function createAvatarUploadSignatureAction(): Promise<AvatarUploadSignatureState> {
  const user = await getCurrentUserFromRequest();

  if (!user) {
    return {
      message: "Please login again before uploading an avatar.",
      success: false,
    };
  }

  try {
    const config = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `nikharta-roop/users/${user.id}/avatar`;
    const publicId = `avatar-${timestamp}`;
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
      message: "Upload signature created.",
      publicId,
      signature,
      success: true,
      timestamp,
      uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      uploadTypes: AVATAR_UPLOAD_TYPES,
    };
  } catch {
    return {
      message: "Avatar upload is not configured.",
      success: false,
    };
  }
}
