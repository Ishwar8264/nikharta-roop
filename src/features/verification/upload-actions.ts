"use server";

import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/auth/get-session";
import {
  getAuthenticatedCloudinaryImage,
  signCloudinaryParameters,
} from "@/lib/cloudinary";
import { createMediaAsset } from "@/server/modules/media/media.repository";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { findVerificationBySalonId } from "@/server/modules/verification/verification.repository";
import type { UploadSignature, UploadedImage } from "@/features/media/types";
import { VERIFICATION_FORMATS, VERIFICATION_MAX_BYTES } from "./policy";

async function requireOwner(slug: string) {
  const user = await getSession();
  if (!user) throw new Error("Authentication required");
  const salon = await getSalonForServiceManagement(slug, user.id);
  if (salon.viewerRole !== "OWNER")
    throw new Error("Only the salon owner can upload verification documents");
  const verification = await findVerificationBySalonId(salon.id);
  if (
    verification?.status === "VERIFIED" ||
    verification?.status === "SUSPENDED"
  )
    throw new Error("Documents cannot be changed for this verification status");
  return { user, salon };
}

/** Private, non-overwritable uploads have a reserved namespace that general media cannot register. */
export async function signVerificationUpload(
  slug: string,
): Promise<UploadSignature> {
  const { user, salon } = await requireOwner(slug);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  if (!cloudName || !apiKey) throw new Error("Cloudinary is not configured");
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `nikharta-roop/verification/${user.id}/${salon.id}/${randomUUID()}`;
  const allowedFormats = VERIFICATION_FORMATS.join(",");
  const signature = signCloudinaryParameters({
    public_id: publicId,
    timestamp,
    type: "authenticated",
    overwrite: false,
    allowed_formats: allowedFormats,
  });
  return {
    cloudName,
    apiKey,
    timestamp,
    publicId,
    signature,
    type: "authenticated",
    overwrite: false,
    allowedFormats,
  };
}

/** Register only provider-confirmed private images, scoped to this owner and salon. */
export async function registerVerificationUpload(
  slug: string,
  publicId: string,
): Promise<UploadedImage> {
  const { user, salon } = await requireOwner(slug);
  const prefix = `nikharta-roop/verification/${user.id}/${salon.id}/`;
  if (
    !publicId.startsWith(prefix) ||
    !/^[0-9a-f-]{36}$/.test(publicId.slice(prefix.length))
  )
    throw new Error("Invalid verification upload");
  const image = await getAuthenticatedCloudinaryImage(publicId);
  if (
    image.public_id !== publicId ||
    image.type !== "authenticated" ||
    image.resource_type !== "image" ||
    !VERIFICATION_FORMATS.some((format) => format === image.format) ||
    !Number.isInteger(image.bytes) ||
    image.bytes <= 0 ||
    image.bytes > VERIFICATION_MAX_BYTES ||
    !(image.width > 0) ||
    !(image.height > 0)
  )
    throw new Error("Upload a valid JPG, PNG, WebP or AVIF image up to 5 MB");
  const asset = await createMediaAsset(user.id, {
    publicId,
    url: image.secure_url,
    folder: prefix.slice(0, -1),
    purpose: "VERIFICATION",
    attachedToType: "SALON_VERIFICATION",
    attachedToId: salon.id,
    bytes: image.bytes,
    width: image.width,
    height: image.height,
    format: image.format,
  });
  return {
    mediaId: asset.id,
    publicId,
    url: `/api/v1/salons/${encodeURIComponent(salon.id)}/verification/documents/${asset.id}`,
    bytes: image.bytes,
    width: image.width,
    height: image.height,
    format: image.format,
  };
}
