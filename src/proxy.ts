import { NextResponse, type NextRequest } from "next/server";

import {
  authLimiter,
  authenticatedLimiter,
  rateLimitHeaders,
  standardLimiter,
} from "@/lib/rate-limit";
import { ACCESS_COOKIE_NAME } from "@/server/auth/auth.constants";
import { isMutationRequestTrusted } from "@/server/auth/csrf";
import { verifyAccessToken } from "@/server/auth/jwt";

/**
 * Routes reachable without any access token for every HTTP method.
 *
 * Why:
 * Registration, login, refresh, logout, OTP, and password recovery must all
 * work before a session exists (or after one has ended). Health checks are
 * called by monitoring tools that carry no credentials.
 */
const FULLY_PUBLIC_PATHS = new Set<string>([
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/auth/otp/send",
  "/api/v1/auth/otp/verify",
  "/api/v1/auth/password/forgot",
  "/api/v1/auth/password/reset",
  "/api/v1/health",
  "/api/v1/coupons/validate",
  "/api/v1/cron/appointment-reminders",
  "/api/v1/cron/notification-retry",
  "/api/v1/cron/otp-cleanup",
  "/api/v1/cron/token-cleanup",
  "/api/v1/auth/oauth/providers",
  "/api/v1/auth/oauth/google",
  "/api/v1/auth/oauth/google/callback",
  "/api/v1/auth/oauth/apple",
  "/api/v1/auth/oauth/apple/callback",
  "/api/v1/auth/oauth/facebook",
  "/api/v1/auth/oauth/facebook/callback",
]);

/**
 * Exact paths where only GET and HEAD are public; mutations still require auth.
 *
 * Why:
 * Browsing the salon directory must work for anonymous visitors, but creating
 * a salon needs a signed-in owner. Splitting by method keeps the read surface
 * open without opening the write surface.
 */
const PUBLIC_GET_PATHS = new Set<string>([
  "/api/v1/salons",
  "/api/v1/services/categories",
  "/api/v1/products/categories",
  "/api/v1/blog/posts",
  "/api/v1/blog/categories",
  "/api/v1/blog/tags",
  "/api/v1/coupons/validate",
]);

/**
 * Regex patterns for paths where GET/HEAD is public but deeper nesting is not.
 *
 * Why:
 * `/api/v1/salons/{slug}` is a public detail lookup, but
 * `/api/v1/salons/{id}/members` must stay behind auth. The pattern matches
 * exactly one trailing segment so nested resources fall through to the normal
 * authentication check.
 */
const PUBLIC_GET_PATTERNS: RegExp[] = [
  /^\/api\/v1\/salons\/[^/]+$/,
  /^\/api\/v1\/salons\/[^/]+\/services$/,
  /^\/api\/v1\/salons\/[^/]+\/services\/[^/]+$/,
  /^\/api\/v1\/salons\/[^/]+\/services\/[^/]+\/staff$/,
  /^\/api\/v1\/salons\/[^/]+\/products$/,
  /^\/api\/v1\/salons\/[^/]+\/products\/[^/]+$/,
  /^\/api\/v1\/salons\/[^/]+\/working-hours$/,
  /^\/api\/v1\/salons\/[^/]+\/availability$/,
  /^\/api\/v1\/services\/[^/]+\/reviews$/,
  /^\/api\/v1\/products\/[^/]+\/reviews$/,
  /^\/api\/v1\/staff\/[^/]+\/ratings$/,
  /^\/api\/v1\/blog\/posts\/[^/]+$/,
  /^\/api\/v1\/blog\/posts\/[^/]+\/comments$/,
  /^\/api\/v1\/coupons\/[^/]+$/,
];

/** Auth paths that get the stricter limiter, even though they are public. */
const AUTH_PATH_PREFIX = "/api/v1/auth";

/** Path prefixes that require elevated platform roles. */
const ADMIN_PATH_PREFIXES = ["/api/v1/admin"];

/** Roles allowed to access admin-only routes. */
const ADMIN_ROLES = new Set(["SUPER_ADMIN"]);

/**
 * Returns true when the request may proceed without an access token.
 *
 * Why:
 * Centralising the "is this public?" decision keeps the ordering of checks
 * explicit and easy to audit as new resources are added. Safe methods only —
 * a public GET path is never implicitly a public POST.
 */
function isPublicRequest(pathname: string, method: string): boolean {
  if (FULLY_PUBLIC_PATHS.has(pathname)) return true;

  if (method !== "GET" && method !== "HEAD") return false;
  if (PUBLIC_GET_PATHS.has(pathname)) return true;
  return PUBLIC_GET_PATTERNS.some((pattern) => pattern.test(pathname));
}

/**
 * Performs rate limiting, authentication, and role checks for API routes.
 *
 * Why:
 * Proxy runs before every matched request and is the cheapest place to reject
 * abusive, unauthenticated, or unauthorized traffic before it reaches route
 * handlers. It verifies the JWT signature and expiry without hitting the
 * database; resource authorization still belongs close to the data source.
 *
 * Verified identity is forwarded as `x-auth-*` request headers so handlers
 * can read it cheaply. Sensitive handlers must still authorize their resource
 * access close to the data; this boundary only proves current identity/role.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const publicRequest = isPublicRequest(pathname, request.method);

  // ----- 1. CSRF / cross-origin mutation protection -----
  if (!isMutationRequestTrusted(request)) {
    return NextResponse.json(
      { message: "Invalid or missing CSRF token" },
      { status: 403 },
    );
  }

  // ----- 2. Rate limiting -----
  // Public auth routes are the most attacked; they get the strict limiter
  // keyed by IP. Everything else gets keyed by user id once verified, or IP
  // when the caller is anonymous.
  if (
    FULLY_PUBLIC_PATHS.has(pathname) &&
    pathname.startsWith(AUTH_PATH_PREFIX)
  ) {
    const ip = clientIp(request);
    const result = await authLimiter.limit(ip);

    if (!result.success) {
      return tooManyRequests(result);
    }
  } else if (publicRequest && pathname !== "/api/v1/health") {
    const result = await standardLimiter.limit(clientIp(request));
    if (!result.success) return tooManyRequests(result);
  }

  // ----- 3. Public routes skip auth (rate limited above when applicable) -----
  if (publicRequest) {
    return NextResponse.next();
  }

  // ----- 4. Extract + verify token -----
  const token = extractAccessToken(request);

  if (!token) {
    // Anonymous traffic still gets the standard limiter so a single IP
    // cannot hammer protected endpoints hoping for a lucky 200.
    const result = await standardLimiter.limit(clientIp(request));
    if (!result.success) return tooManyRequests(result);

    return unauthorizedResponse();
  }

  let payload: { sub: string; role: string };

  try {
    payload = await verifyAccessToken(token);
  } catch {
    return unauthorizedResponse();
  }

  // ----- 5. Authenticated rate limit (keyed by user id) -----
  const result = await authenticatedLimiter.limit(payload.sub);
  if (!result.success) {
    return tooManyRequests(result);
  }

  // ----- 6. Admin gate -----
  if (isAdminPath(pathname) && !ADMIN_ROLES.has(payload.role)) {
    return forbiddenResponse();
  }

  // ----- 7. Forward identity to handler -----
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-auth-user-id", payload.sub);
  requestHeaders.set("x-auth-role", payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

/**
 * Restricts the proxy to versioned API routes.
 *
 * Why:
 * Without a matcher, proxy would run on static assets, image optimizations,
 * and the Swagger UI — adding latency to traffic unrelated to auth.
 */
export const config = {
  matcher: [
    "/api/v1/:path*",
    "/dashboard/:path*",
    "/appointments/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/favorites/:path*",
    "/loyalty/:path*",
  ],
};

/** Returns true when the path lives under an admin-only prefix. */
function isAdminPath(pathname: string): boolean {
  return ADMIN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Reads the access token from the Authorization header or cookie. */
function extractAccessToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");

  if (header) {
    const [scheme, value] = header.split(/\s+/, 2);
    if (scheme?.toLowerCase() === "bearer" && value) {
      return value.trim() || null;
    }
  }

  return request.cookies.get(ACCESS_COOKIE_NAME)?.value ?? null;
}

/** Extracts the client IP, preferring the proxy-set forwarding header. */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "anonymous";
}

/** 401 with a generic message so token failures do not leak details. */
function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { message: "Authentication required" },
    { status: 401 },
  );
}

/** 403 for authenticated users who lack the required role. */
function forbiddenResponse(): NextResponse {
  return NextResponse.json(
    { message: "You do not have permission to access this resource" },
    { status: 403 },
  );
}

/** 429 with standard rate-limit headers so clients can back off. */
function tooManyRequests(result: {
  limit: number;
  remaining: number;
  reset: number;
}): NextResponse {
  return NextResponse.json(
    { message: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    },
  );
}
