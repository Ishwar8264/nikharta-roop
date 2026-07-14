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
  return crypto.createHash("sha256").update(otp).digest("hex");
};
