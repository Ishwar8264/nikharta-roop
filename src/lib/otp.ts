/**
 * ========================================================
 * OTP UTILITIES
 * Handles generating a cryptographically secure 6-digit OTP
 * and hashing it using SHA-256 before storing in the database.
 * ========================================================
 */

import crypto from "node:crypto";

/**
 * Generate a cryptographically secure 6-digit random OTP.
 * Uses Node.js crypto.randomInt to ensure it's unpredictable.
 */
export const generateOtp = (): string => {
  // Generates a random integer between 100000 (inclusive) and 999999 (exclusive)
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash the OTP using SHA-256 before storing it in the database.
 * This ensures we never store plain-text OTPs, complying with security best practices.
 * The hash is a 64-character hexadecimal string.
 */
export const hashOtp = (otp: string): string => {
  // Prefer a dedicated OTP secret while keeping existing JWT configuration backward-compatible.
  const otpSecret =
    process.env.AUTH_OTP_SECRET ?? process.env.JWT_REFRESH_SECRET;

  // Fail closed when secure OTP hashing has not been configured.
  if (!otpSecret) {
    throw new Error("AUTH_OTP_SECRET or JWT_REFRESH_SECRET is not configured");
  }

  // Create a keyed hash so identical OTP values cannot be tested without the secret.
  return crypto.createHmac("sha256", otpSecret).update(otp).digest("hex");
};

/**
 * Compare an entered OTP with its stored HMAC using constant-time comparison.
 */
export const verifyOtpHash = (otp: string, storedHash: string): boolean => {
  // Hash the entered OTP with the same server-side secret.
  const inputHash = hashOtp(otp);

  // Convert both hexadecimal hashes into equal-length buffers.
  const inputBuffer = Buffer.from(inputHash, "hex");

  // Convert the stored hexadecimal hash for constant-time comparison.
  const storedBuffer = Buffer.from(storedHash, "hex");

  // Reject malformed stored values before timing-safe comparison requires equal lengths.
  if (inputBuffer.length !== storedBuffer.length) {
    return false;
  }

  // Compare without leaking which character differed through response timing.
  return crypto.timingSafeEqual(inputBuffer, storedBuffer);
};
