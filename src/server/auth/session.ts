import "server-only";

import { verifyAccessToken, type AccessTokenPayload } from "./jwt";

const ACCESS_COOKIE_NAME = "accessToken";

/**
 * Resolves the caller's identity from the Authorization header or access cookie.
 *
 * Why:
 * The same helper serves route handlers and (later) middleware, so token
 * extraction and verification rules live in one place. Returns null instead
 * of throwing so callers can decide whether to 401, redirect, or ignore.
 *
 * Token precedence:
 *   1. `Authorization: Bearer <token>` — for API/mobile/Swagger clients.
 *   2. `accessToken` cookie — for browser clients.
 */
export async function getAuthContext(
  request: Request,
): Promise<AccessTokenPayload | null> {
  const token = extractAccessToken(request);
  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    // Expired, tampered, or wrong issuer — all collapse to "not signed in".
    // We never surface the underlying jose error to avoid leaking details.
    return null;
  }
}

/** Reads a token from the Authorization header first, then the cookie. */
function extractAccessToken(request: Request): string | null {
  const header = request.headers.get("authorization");

  if (header) {
    const [scheme, value] = header.split(/\s+/, 2);
    if (scheme?.toLowerCase() === "bearer" && value) {
      return value.trim() || null;
    }
  }

  return readCookie(request, ACCESS_COOKIE_NAME);
}

/** Reads a single cookie value from the raw `Cookie` header. */
export function readCookie(request: Request, name: string): string | null {
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
