import { NextResponse } from "next/server";

import { rotateRefreshToken } from "@/server/auth/token.service";

/** Must match the values used when tokens were issued. */
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";
/** Must match the path used when the refresh cookie was originally set. */
const REFRESH_COOKIE_PATH = "/api/v1/auth";

/**
 * Rotates the refresh token cookie into a fresh access + refresh pair.
 *
 * Why:
 * The refresh token is sent as an httpOnly cookie so JavaScript cannot steal
 * it. On every successful call, the old refresh token is revoked and a new
 * one issued — reuse of the old one is treated as theft.
 */
export async function POST(request: Request): Promise<Response> {
  const rawRefreshToken = readCookie(request, REFRESH_COOKIE_NAME);

  if (!rawRefreshToken) {
    return unauthorizedResponse("Missing refresh token");
  }

  const tokens = await rotateRefreshToken(rawRefreshToken, {
    userAgent: request.headers.get("user-agent") ?? undefined,
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      undefined,
  });

  if (!tokens) {
    // Invalid, expired, or reused token — clear cookies so the client is
    // forced to log in again instead of retrying with stale state.
    return unauthorizedResponse("Invalid or expired refresh token");
  }

  const response = NextResponse.json(
    {
      message: "Token refreshed",
      data: {
        accessToken: tokens.accessToken,
        accessTokenExpiresIn: tokens.accessTokenExpiresIn,
      },
    },
    { status: 200 },
  );

  response.cookies.set(ACCESS_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });

  return response;
}

/** Reads a single cookie value from the raw `Cookie` header. */
function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const pair of header.split(/;\s*/)) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;

    const key = pair.slice(0, eqIndex);
    if (key !== name) continue;

    return decodeURIComponent(pair.slice(eqIndex + 1));
  }

  return null;
}

/** 401 with both auth cookies cleared so the client cannot retry stale state. */
function unauthorizedResponse(message: string): NextResponse {
  const response = NextResponse.json({ message }, { status: 401 });

  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
  });

  return response;
}
