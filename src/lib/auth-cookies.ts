import type { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_TOKEN_EXPIRY_SECONDS,
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_REFRESH_COOKIE_NAME,
  AUTH_SESSION_EXPIRY_SECONDS,
  AUTH_SESSION_HINT_COOKIE_NAME,
} from "@/src/constants/auth";
import { generateOptimisticSessionToken } from "@/src/lib/jwt";

// Send the access token wherever authenticated application requests may need it.
const ACCESS_TOKEN_COOKIE_PATH = "/";

// Send the refresh token only to the endpoint that rotates the session.
const REFRESH_TOKEN_COOKIE_PATH = "/api/v1/auth/refresh";

// Send the non-sensitive signed session marker to private page requests.
const SESSION_HINT_COOKIE_PATH = "/";

// Remember the previous path so existing broad refresh cookies can be removed safely.
const LEGACY_REFRESH_TOKEN_COOKIE_PATH = "/";

// Reuse the cookie security policy while allowing token-specific paths and lifetimes.
const getCookieOptions = (maxAge: number, path: string) => ({
  httpOnly: true,
  maxAge,
  path,
  priority: "high" as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
});

// Append a separate expiry header because Next.js replaces same-name cookies across paths.
const clearLegacyRefreshCookie = (response: NextResponse) => {
  // Include Secure in production so the legacy cookie is removed with its original policy.
  const secureAttribute = process.env.NODE_ENV === "production" ? "; Secure" : "";

  // Expire the previous broad-path cookie without replacing the new scoped cookie header.
  response.headers.append(
    "Set-Cookie",
    `${AUTH_REFRESH_COOKIE_NAME}=; Path=${LEGACY_REFRESH_TOKEN_COOKIE_PATH}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Priority=High; SameSite=Lax${secureAttribute}`,
  );
};

// Persist a verified browser session without exposing tokens to client storage.
export const setAuthCookies = (
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) => {
  // Store the short-lived access token in an HttpOnly cookie.
  response.cookies.set(
    AUTH_ACCESS_COOKIE_NAME,
    tokens.accessToken,
    getCookieOptions(ACCESS_TOKEN_EXPIRY_SECONDS, ACCESS_TOKEN_COOKIE_PATH),
  );

  // Store the rotating refresh token only on its dedicated endpoint path.
  response.cookies.set(
    AUTH_REFRESH_COOKIE_NAME,
    tokens.refreshToken,
    getCookieOptions(AUTH_SESSION_EXPIRY_SECONDS, REFRESH_TOKEN_COOKIE_PATH),
  );

  // Sign a low-privilege marker so Proxy never needs the scoped refresh token.
  const sessionHint = generateOptimisticSessionToken(tokens.refreshToken);

  // Keep optimistic page access aligned with the complete refresh-session lifetime.
  response.cookies.set(
    AUTH_SESSION_HINT_COOKIE_NAME,
    sessionHint,
    getCookieOptions(AUTH_SESSION_EXPIRY_SECONDS, SESSION_HINT_COOKIE_PATH),
  );

  // Remove any older refresh cookie that was sent with every application request.
  clearLegacyRefreshCookie(response);
};

// Remove both browser tokens when logout completes.
export const clearAuthCookies = (response: NextResponse) => {
  // Expire the access token immediately using its original cookie path.
  response.cookies.set(AUTH_ACCESS_COOKIE_NAME, "", {
    ...getCookieOptions(0, ACCESS_TOKEN_COOKIE_PATH),
    expires: new Date(0),
  });

  // Expire the refresh token immediately using its original cookie path.
  response.cookies.set(AUTH_REFRESH_COOKIE_NAME, "", {
    ...getCookieOptions(0, REFRESH_TOKEN_COOKIE_PATH),
    expires: new Date(0),
  });

  // Expire the optimistic session marker so Proxy immediately blocks private pages.
  response.cookies.set(AUTH_SESSION_HINT_COOKIE_NAME, "", {
    ...getCookieOptions(0, SESSION_HINT_COOKIE_PATH),
    expires: new Date(0),
  });

  // Clear the legacy broad-path cookie for sessions created before this hardening.
  clearLegacyRefreshCookie(response);
};

// Read bearer tokens for API clients and cookies for same-origin browsers.
export const getAccessTokenFromRequest = (request: NextRequest) => {
  // Read the optional standard authorization header first.
  const authHeader = request.headers.get("authorization");

  // Prefer an explicitly supplied bearer token for mobile and external clients.
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length) || undefined;
  }

  // Fall back to the protected browser cookie for same-origin requests.
  return request.cookies.get(AUTH_ACCESS_COOKIE_NAME)?.value;
};

// Read the rotating refresh token from the protected browser cookie.
export const getRefreshTokenFromRequest = (request: NextRequest) =>
  // Return undefined when the browser has no active refresh session.
  request.cookies.get(AUTH_REFRESH_COOKIE_NAME)?.value;
