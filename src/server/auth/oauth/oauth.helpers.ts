import "server-only";

import type { NextResponse } from "next/server";

import type { OAuthProviderId } from "./oauth.types";

/**
 * Cookie names for the OAuth flow.
 *
 * Why:
 * State and verifier must be readable by the callback but not by client
 * JavaScript, so they are httpOnly. Kept as constants rather than literals
 * so a future rename does not leave stale cookies behind.
 */
const STATE_COOKIE = "oauth_state";
const VERIFIER_COOKIE = "oauth_verifier";

/** How long a started flow may stay pending. */
const FLOW_TTL_SECONDS = 10 * 60;

/**
 * Writes the state and PKCE verifier cookies onto the redirect response.
 *
 * Why:
 * `sameSite: "lax"` is essential — the provider's callback is a top-level
 * cross-site navigation, and `strict` would prevent the cookie from being
 * sent, breaking the flow. `secure` is set in production but must be off in
 * local dev where the app runs over plain HTTP.
 *
 * The cookies are attached directly to the redirect response because
 * Next.js 16 does not carry cookies set via `next/headers` over into a
 * `NextResponse.redirect()`. Attaching them here keeps the browser and the
 * server in sync without a second write.
 */
export function attachOAuthFlowCookies(
  response: NextResponse,
  input: { state: string; codeVerifier: string; providerId: OAuthProviderId },
): void {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(STATE_COOKIE, input.state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: FLOW_TTL_SECONDS,
  });

  response.cookies.set(VERIFIER_COOKIE, input.codeVerifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: FLOW_TTL_SECONDS,
  });
}

/** Reads the state cookie from the incoming request. */
export function readOAuthStateCookie(request: Request): string | null {
  return readCookie(request, STATE_COOKIE);
}

/** Reads the PKCE verifier cookie from the incoming request. */
export function readOAuthVerifierCookie(request: Request): string | null {
  return readCookie(request, VERIFIER_COOKIE);
}

/**
 * Clears the flow cookies after a callback completes or fails.
 *
 * Why:
 * The state and verifier are single-use. Leaving them on the client after
 * the callback lets a second, unrelated request replay them. Clearing them
 * here keeps the flow airtight and matches how a fresh login expects to
 * begin.
 */
export function clearOAuthFlowCookies(response: NextResponse): void {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(VERIFIER_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
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
