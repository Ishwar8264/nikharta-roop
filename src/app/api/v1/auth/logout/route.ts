import { NextResponse } from "next/server";

import { revokeRefreshToken } from "@/server/auth/token.service";

const ACCESS_COOKIE_NAME = "accessToken";
const REFRESH_COOKIE_NAME = "refreshToken";
/** Must match the path used when the refresh cookie was originally set. */
const REFRESH_COOKIE_PATH = "/api/v1/auth";

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

  // Expire both cookies by setting maxAge: 0. Path must match exactly what
  // was used when setting them, otherwise the browser keeps the old cookie.
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
