import { createHash, randomBytes, randomInt } from "node:crypto";

/**
 * Generates the 6-digit OTP shown to users.
 */
export function generateOtp() {
  return String(randomInt(100000, 1000000));
}

/**
 * Creates an opaque bearer token for API sessions.
 */
export function generateAuthToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

/**
 * Hashes sensitive auth tokens before they are stored.
 */
export function hashAuthToken(token: string, secret: string) {
  return createHash("sha256").update(`${token}:${secret}`).digest("hex");
}

/**
 * Hashes an OTP with mobile number and app secret.
 */
export function hashOtp(mobile: string, otp: string, secret: string) {
  return createHash("sha256")
    .update(`${mobile}:${otp}:${secret}`)
    .digest("hex");
}
