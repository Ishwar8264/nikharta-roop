"use server";

import type { MediaPurpose } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth/get-session";
import { createMediaAssetSchema } from "@/server/modules/media/media.schema";
import { saveMediaAsset } from "@/server/modules/media/media.service";

import type { MediaAsset, UploadedImage } from "../types";

/**
 * Server Action: persists an uploaded Cloudinary asset to the DB.
 *
 * Why a Server Action, not the POST route:
 * The browser-facing flow only ever runs inside our own UI. Server Actions
 * remove the HTTP ceremony (CORS, JSON parsing, status mapping) and let
 * the caller await a typed value. The POST route stays for non-browser
 * clients that prefer REST.
 */
export async function saveMedia(
  asset: UploadedImage,
  options: {
    purpose?: MediaPurpose;
    attachedToType?: string;
    attachedToId?: string;
  } = {},
): Promise<MediaAsset> {
  const user = await getSession();
  if (!user) throw new Error("Authentication required");

  const validation = createMediaAssetSchema.safeParse({
    url: asset.url,
    publicId: asset.publicId,
    width: asset.width,
    height: asset.height,
    format: asset.format,
    bytes: asset.bytes,
    purpose: options.purpose ?? "GENERAL",
    attachedToType: options.attachedToType,
    attachedToId: options.attachedToId,
  });
  if (!validation.success) throw new Error(validation.error.issues[0]!.message);

  const saved = await saveMediaAsset(user.id, validation.data);

  // The service returns Dates; JSON-serialize to match the client type.
  return {
    ...saved,
    createdAt: saved.createdAt.toISOString(),
  };
}
