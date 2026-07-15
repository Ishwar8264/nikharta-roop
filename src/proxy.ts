// Load stable cookie names shared with the server session routes.
import {
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_SESSION_HINT_COOKIE_NAME,
} from "@/src/constants/auth";
// Load focused JWT verification for optimistic route access only.
import {
  verifyAccessToken,
  verifyOptimisticSessionToken,
} from "@/src/lib/jwt";
// Load the request type accepted by the Next.js 16 Proxy convention.
import type { NextRequest } from "next/server";
// Load the response helper used for pass-through and login redirects.
import { NextResponse } from "next/server";

// Keep the public login destination explicit for unauthenticated redirects.
const LOGIN_PATH = "/login";

// Validate one optional cookie with a focused verifier and fail closed on any error.
const isValidCookieToken = (
  token: string | undefined,
  verifyToken: (value: string) => unknown,
) => {
  // Reject requests that do not include the selected authentication marker.
  if (!token) {
    return false;
  }

  try {
    // Verify signature, expiry, and purpose before allowing optimistic page access.
    verifyToken(token);

    // Mark the request optimistic only after the selected verifier succeeds.
    return true;
  } catch {
    // Treat malformed, expired, or incorrectly purposed tokens as unauthenticated.
    return false;
  }
};

// Gate matched private pages before rendering without performing database work.
export function proxy(request: NextRequest) {
  // Read the signed long-lived marker created alongside the refresh session.
  const sessionHint = request.cookies.get(AUTH_SESSION_HINT_COOKIE_NAME)?.value;

  // Prefer the dedicated low-privilege marker for normal private navigation.
  const hasSessionHint = isValidCookieToken(
    sessionHint,
    verifyOptimisticSessionToken,
  );

  // Allow older sessions temporarily when their short-lived access cookie remains valid.
  const accessToken = request.cookies.get(AUTH_ACCESS_COOKIE_NAME)?.value;

  // Verify the fallback access token without querying the persisted session in Proxy.
  const hasLegacyAccess = isValidCookieToken(accessToken, verifyAccessToken);

  // Continue matched private navigation when either optimistic cookie is valid.
  if (hasSessionHint || hasLegacyAccess) {
    return NextResponse.next();
  }

  // Redirect anonymous private navigation before the protected page renders.
  return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
}

// Run Proxy only for the current private route family and its future nested pages.
export const config = {
  matcher: ["/portfolio/:path*"],
};
