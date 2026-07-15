// Load stable cookie names shared with server session routes.
import {
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_SESSION_HINT_COOKIE_NAME,
} from "@/src/constants/auth";
// Load the single shared route policy and role-home authorization source.
import {
  getProtectedRoutePolicy,
  ROLE_HOME_PATHS,
} from "@/src/constants/authorization";
// Load database-backed browser session validation for Proxy authorization.
import { validateBrowserSessionService } from "@/src/services/auth/auth-session.service";
// Load the request type accepted by the Next.js 16 Proxy convention.
import type { NextRequest } from "next/server";
// Load the response helper used before protected routes render.
import { NextResponse } from "next/server";

// Keep the public login destination explicit for unauthenticated redirects.
const LOGIN_PATH = "/login";

// Enforce authentication and current database roles before protected routes render.
export async function proxy(request: NextRequest) {
  // Resolve the shared server policy for the matched protected URL.
  const policy = getProtectedRoutePolicy(request.nextUrl.pathname);

  // Fail closed if a future matcher is added without an explicit authorization policy.
  if (!policy) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  // Validate both browser proofs against their exact persisted database sessions.
  const session = await validateBrowserSessionService({
    accessToken: request.cookies.get(AUTH_ACCESS_COOKIE_NAME)?.value,
    sessionHint: request.cookies.get(AUTH_SESSION_HINT_COOKIE_NAME)?.value,
  });

  // Redirect unauthenticated or revoked sessions before any page component executes.
  if (!session) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  // Redirect authenticated users away from pages outside their current role hierarchy.
  if (!policy.roles.includes(session.role)) {
    return NextResponse.redirect(
      new URL(ROLE_HOME_PATHS[session.role], request.url),
    );
  }

  // Continue only after server-side authentication and authorization both succeed.
  return NextResponse.next();
}

// Keep literal matchers because Next.js statically analyzes this exported configuration.
export const config = {
  matcher: [
    "/user/:path*",
    "/staff/:path*",
    "/admin/:path*",
    "/super-admin/:path*",
  ],
};
