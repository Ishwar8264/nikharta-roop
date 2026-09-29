"use server";

import { createHash, randomUUID } from "node:crypto";

import { getSession } from "@/lib/auth/get-session";
import type { UploadSignature } from "../types";

/**
 * Generates a signed Cloudinary upload payload for the current user.
 *
 * The signed public ID scopes the asset to the current user and prevents the
 * browser from choosing another user's Cloudinary asset identifier.
 */
export async function signUpload(): Promise<UploadSignature> {
  const user = await getSession();
  if (!user) throw new Error("Authentication required");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `nikharta-roop/${user.id}/${randomUUID()}`;

  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return { cloudName, apiKey, timestamp, signature, publicId };
}
