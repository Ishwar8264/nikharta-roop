import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME } from "@/server/auth/auth.constants";
import {
  clearSessionCookies,
  setSessionCookies,
} from "@/server/auth/cookies";
import { readCookie } from "@/server/auth/session";
import { rotateRefreshToken } from "@/server/auth/token.service";

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

  let tokens;

  try {
    tokens = await rotateRefreshToken(rawRefreshToken, {
      userAgent: request.headers.get("user-agent") ?? undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        undefined,
    });
  } catch (error) {
    console.error("Token refresh failed", error);
    return NextResponse.json(
      { message: "Unable to refresh session" },
      { status: 500 },
    );
  }

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

  setSessionCookies(response, tokens);

  return response;
}

/** 401 with both auth cookies cleared so the client cannot retry stale state. */
function unauthorizedResponse(message: string): NextResponse {
  const response = NextResponse.json({ message }, { status: 401 });
  clearSessionCookies(response);

  return response;
}
