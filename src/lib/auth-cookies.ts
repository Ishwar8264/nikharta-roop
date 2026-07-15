import type { NextRequest, NextResponse } from "next/server";

import {
  ACCESS_TOKEN_EXPIRY_SECONDS,
  AUTH_SESSION_EXPIRY_SECONDS,
} from "@/src/constants/auth";

// Keep cookie names stable across verification, refresh, middleware, and logout.
const ACCESS_TOKEN_COOKIE = "nikharta_access_token";

// Keep refresh tokens separate so their longer lifetime remains explicit.
const REFRESH_TOKEN_COOKIE = "nikharta_refresh_token";

// Reuse the cookie security policy while allowing token-specific lifetimes.
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  maxAge,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
});

// Persist a verified browser session without exposing tokens to client storage.
export const setAuthCookies = (
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) => {
  // Store the short-lived access token in an HttpOnly cookie.
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    getCookieOptions(ACCESS_TOKEN_EXPIRY_SECONDS),
  );

  // Store the rotating refresh token in a separate HttpOnly cookie.
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    getCookieOptions(AUTH_SESSION_EXPIRY_SECONDS),
  );
};

// Remove both browser tokens when logout completes.
export const clearAuthCookies = (response: NextResponse) => {
  // Expire the access token immediately using its original cookie path.
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...getCookieOptions(0),
    expires: new Date(0),
  });

  // Expire the refresh token immediately using its original cookie path.
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...getCookieOptions(0),
    expires: new Date(0),
  });
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
  return request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
};

// Read the rotating refresh token from the protected browser cookie.
export const getRefreshTokenFromRequest = (request: NextRequest) =>
  // Return undefined when the browser has no active refresh session.
  request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
