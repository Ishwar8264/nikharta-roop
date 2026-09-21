import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

const CSRF_TOKEN_BYTES = 32;

/** Generates a cryptographically random CSRF token. */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_BYTES).toString("base64url");
}

/**
 * Constant-time comparison of a CSRF token from header and cookie.
 *
 * Why:
 * `timingSafeEqual` throws when the two buffers differ in length, which would
 * turn a length mismatch into a 500. We guard the length first so attackers
 * only ever see a clean `false`.
 */
export function verifyCsrfToken(
  tokenFromHeader: string | null,
  tokenFromCookie: string | null,
): boolean {
  if (!tokenFromHeader || !tokenFromCookie) return false;

  const headerBuffer = Buffer.from(tokenFromHeader);
  const cookieBuffer = Buffer.from(tokenFromCookie);

  if (headerBuffer.length !== cookieBuffer.length) return false;

  return timingSafeEqual(headerBuffer, cookieBuffer);
}
