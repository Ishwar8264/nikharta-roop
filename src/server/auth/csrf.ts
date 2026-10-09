import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

import type { NextRequest } from "next/server";

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "./auth.constants";

const CSRF_TOKEN_BYTES = 32;

const PUBLIC_MUTATION_PATHS = new Set([
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/otp/send",
  "/api/v1/auth/otp/verify",
  "/api/v1/auth/password/forgot",
  "/api/v1/auth/password/reset",
]);

const CROSS_SITE_CALLBACK_PATHS = new Set([
  "/api/v1/auth/oauth/apple/callback",
]);

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

/**
 * Rejects browser-forged mutation requests while preserving bearer clients.
 *
 * Why:
 * Bearer credentials are explicitly supplied by the caller and are not
 * attached automatically by a browser, so they do not need a CSRF token.
 * Cookie-authenticated mutations must pass both same-origin signals and the
 * double-submit token issued with the session.
 */
export function isMutationRequestTrusted(request: NextRequest): boolean {
  if (isSafeMethod(request.method)) return true;

  // Apple returns a cross-site form POST. The callback independently proves
  // the request with an exact, single-use OAuth state value before login.
  if (CROSS_SITE_CALLBACK_PATHS.has(request.nextUrl.pathname)) return true;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site" || fetchSite === "same-site") return false;

  const origin = request.headers.get("origin");
  const expectedOrigin = process.env.APP_ORIGIN ?? request.nextUrl.origin;
  if (origin && origin !== expectedOrigin) return false;

  // Page Server Actions use Next.js origin/host validation rather than the
  // API client's double-submit header. Require an explicit trusted origin;
  // an action header must never bypass CSRF checks on API routes.
  if (
    request.method === "POST" &&
    !/^\/api(?:\/|$)/.test(request.nextUrl.pathname) &&
    Boolean(request.headers.get("next-action")) &&
    origin === expectedOrigin
  ) {
    return true;
  }

  if (hasBearerToken(request)) return true;
  if (PUBLIC_MUTATION_PATHS.has(request.nextUrl.pathname)) return true;

  const hasAmbientAuth =
    request.cookies.has("accessToken") || request.cookies.has("refreshToken");
  if (!hasAmbientAuth) return true;

  return verifyCsrfToken(
    request.headers.get(CSRF_HEADER_NAME),
    request.cookies.get(CSRF_COOKIE_NAME)?.value ?? null,
  );
}

function isSafeMethod(method: string): boolean {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

function hasBearerToken(request: NextRequest): boolean {
  return /^Bearer\s+\S+$/i.test(request.headers.get("authorization") ?? "");
}
