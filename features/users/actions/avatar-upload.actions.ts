"use server";

import { getCurrentUserFromRequest } from "@/features/auth/helpers/auth-session.server";
import type { MediaUploaderItem } from "@/features/media/types/media-uploader.types";
import {
  createAvatarUploadSignature,
  listAvatarCloudinaryItems,
} from "@/features/users/helpers/avatar-cloudinary.server";

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

type AvatarListState =
  | {
      items: MediaUploaderItem[];
      message: string;
      success: true;
    }
  | {
      items: [];
      message: string;
      success: false;
    };

// Creates a short-lived signed Cloudinary upload contract for this user.
export async function createAvatarUploadSignatureAction(
  fileHash?: string,
): Promise<AvatarUploadSignatureState> {
  const user = await getCurrentUserFromRequest();

  if (!user) {
    // Do not expose Cloudinary signing to anonymous requests.
    return {
      message: "Please login again before uploading an avatar.",
      success: false,
    };
  }

  try {
    const signature = createAvatarUploadSignature(user.id, fileHash);

    return {
      ...signature,
      message: "Upload signature created.",
      success: true,
    };
  } catch {
    return {
      message: "Avatar upload is not configured.",
      success: false,
    };
  }
}

// Loads existing avatar uploads from this user's Cloudinary avatar folder.
export async function listAvatarUploadsAction(): Promise<AvatarListState> {
  const user = await getCurrentUserFromRequest();

  if (!user) {
    // The media library is user-scoped, so logged-out users get an empty list.
    return { items: [], message: "Please login again.", success: false };
  }

  try {
    return {
      items: await listAvatarCloudinaryItems(user.id),
      message: "Avatar media loaded.",
      success: true,
    };
  } catch {
    return { items: [], message: "Avatar media is not configured.", success: false };
  }
}
