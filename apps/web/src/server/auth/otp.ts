import "server-only";

import { randomInt } from "node:crypto";

import { hashPassword, verifyPassword } from "./password";

/** How long an OTP stays valid after being issued. */
export const OTP_TTL_MINUTES = 10;

/** Minimum gap between consecutive OTP sends to the same identifier. */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** Maximum wrong attempts before the OTP is burned. */
export const OTP_MAX_ATTEMPTS = 5;

/** Number of digits in a generated OTP. */
const OTP_DIGITS = 6;

/**
 * Generates a zero-padded numeric OTP (e.g. "048213").
 *
 * Why:
 * `crypto.randomInt` is used instead of `Math.random` so codes are not
 * predictable from prior outputs — Math.random is not cryptographically safe.
 */
export function generateOtp(): string {
  const max = 10 ** OTP_DIGITS;
  return String(randomInt(0, max)).padStart(OTP_DIGITS, "0");
}

/** Hashes an OTP using the same scrypt scheme as passwords. */
export function hashOtp(code: string): Promise<string> {
  return hashPassword(code);
}

/** Constant-time comparison of a submitted OTP against its stored hash. */
export function verifyOtp(code: string, codeHash: string): Promise<boolean> {
  return verifyPassword(code, codeHash);
}

/** Returns the instant an OTP issued now should expire. */
export function otpExpiryFromNow(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}
