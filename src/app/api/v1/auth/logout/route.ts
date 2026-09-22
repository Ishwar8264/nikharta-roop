import { NextResponse } from "next/server";

import { REFRESH_COOKIE_NAME } from "@/server/auth/auth.constants";
import { clearSessionCookies } from "@/server/auth/cookies";
import { readCookie } from "@/server/auth/session";
import { revokeRefreshToken } from "@/server/auth/token.service";

/**
 * Ends the current session by revoking the refresh token and clearing cookies.
 *
 * Why:
 * Logout is intentionally idempotent — it always returns 200, even when the
 * cookie is missing or already revoked. Clients call it as a "make me logged
 * out" instruction, not as a transaction, so failing it would only create
 * confusing retry loops. Access tokens are short-lived JWTs and expire on
 * their own; only the refresh token needs server-side revocation.
 */
export async function POST(request: Request): Promise<Response> {
  const rawRefreshToken = readCookie(request, REFRESH_COOKIE_NAME);

  if (rawRefreshToken) {
    // Best-effort revocation. If the token is already gone, revokeRefreshToken
    // is a no-op; if the DB is down, we still clear cookies so the client
    // leaves with a clean local state.
    try {
      await revokeRefreshToken(rawRefreshToken);
    } catch (error) {
      console.error("Failed to revoke refresh token during logout", error);
    }
  }

  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 },
  );

  clearSessionCookies(response);

  return response;
}
