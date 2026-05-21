/**
 * Purpose: Server actions for service image media uploads.
 * Responsibilities: authorize admins, create Cloudinary signatures, and list service image library items.
 * Important notes: only ADMIN and SUPER_ADMIN users can create or browse service media.
 */
"use server";

import { requireAuth } from "@/features/api/server-action-auth";
import type { MediaUploaderItem } from "@/features/media/types/media-uploader.types";
import {
  createServiceImageUploadSignature,
  listServiceImageCloudinaryItems,
} from "@/features/services/helpers/service-cloudinary.server";

export type ServiceUploadSignatureState =
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
      uploadTypes: string[];
      uploadUrl: string;
    };

type ServiceImageListState =
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

/**
 * Creates a short-lived signed Cloudinary upload contract for service images.
 */
export async function createServiceImageUploadSignatureAction(
  fileHash?: string,
): Promise<ServiceUploadSignatureState> {
  const auth = await requireAuth();

  if (!auth.success || !isAdminRole(auth.user.role)) {
    return {
      message: "Please login as an admin before uploading service images.",
      success: false,
    };
  }

  try {
    const signature = createServiceImageUploadSignature(fileHash);

    return {
      ...signature,
      message: "Service image upload signature created.",
      success: true,
    };
  } catch {
    return {
      message: "Service image upload is not configured.",
      success: false,
    };
  }
}

/**
 * Loads reusable service images from the shared service media folder.
 */
export async function listServiceImageUploadsAction(): Promise<ServiceImageListState> {
  const auth = await requireAuth();

  if (!auth.success || !isAdminRole(auth.user.role)) {
    return { items: [], message: "Please login as an admin.", success: false };
  }

  try {
    return {
      items: await listServiceImageCloudinaryItems(),
      message: "Service media loaded.",
      success: true,
    };
  } catch {
    return { items: [], message: "Service media is not configured.", success: false };
  }
}

/**
 * Checks whether a user role can manage service media.
 */
function isAdminRole(role: string | undefined) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
