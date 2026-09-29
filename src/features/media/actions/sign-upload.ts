"use server";

import { createHash } from "node:crypto";

import { getSession } from "@/lib/auth/get-session";
import type { UploadSignature } from "../types";

const FOLDER = "nikharta-roop";

/**
 * Generates a short-lived Cloudinary signature for a browser upload.
 *
 * Why a Server Action instead of a route handler:
 * The signature needs the API secret, which must never reach the browser.
 * A Server Action is the smallest, type-safe way to expose exactly this one
 * operation with no extra HTTP surface. There is no URL to leak, no CORS
 * config, no body parsing — the caller just awaits a typed value.
 *
 * Why the caller must be signed in:
 * Unsigned uploads would let anyone with a browser fill our Cloudinary
 * quota. Requiring a session ties every upload to a real user account.
 *
 * Why the signature is short-lived:
 * Cloudinary checks the timestamp against its own clock and rejects
 * signatures older than 1 hour. We generate fresh per upload, so a leaked
 * signature is only useful for a single request — and the payload it signs
 * (folder + timestamp) carries no sensitive data.
 */
export async function signUpload(): Promise<UploadSignature> {
  const user = await getSession();
  if (!user) {
    throw new Error("Authentication required");
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);

  /**
   * Cloudinary signs a sorted, ampersand-joined list of the params that
   * will travel with the upload. Only params present here are signed —
   * adding a param to the upload request without including it in the
   * signature causes Cloudinary to reject the upload as tampered.
   *
   * Alphabetical order is mandatory: Cloudinary re-sorts and compares.
   */
  const paramsToSign = `folder=${FOLDER}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(paramsToSign + apiSecret)
    .digest("hex");

  return { cloudName, apiKey, timestamp, signature, folder: FOLDER };
}
