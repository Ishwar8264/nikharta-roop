import { NextResponse, type NextRequest } from "next/server";

import { verifyAccessToken } from "@/server/auth/jwt";

const ACCESS_COOKIE_NAME = "accessToken";

/**
 * Routes reachable without any access token.
 *
 * Why:
 * Registration, login, refresh, and logout must work before a session exists
 * (or after it has ended). Health checks are used by monitoring tools that
 * have no credentials. Everything else requires a valid token.
 */
const PUBLIC_PATHS = new Set<string>([
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/logout",
  "/api/v1/health",
]);

/**
 * Path prefixes that require elevated platform roles.
 *
 * Why:
 * Prefix matching keeps the list short as the admin surface grows, and lets
 * a single entry protect every future `/api/v1/admin/*` endpoint by default.
 * Deny-by-default is the safe posture for privileged areas.
 */
const ADMIN_PATH_PREFIXES = ["/api/v1/admin"];

/** Roles allowed to access admin-only routes. */
const ADMIN_ROLES = new Set(["SUPER_ADMIN"]);

/**
 * Performs an optimistic authentication and authorization check for API routes.
 *
 * Why:
 * Proxy runs before every matched request and is the cheapest place to reject
 * unauthenticated or unauthorized traffic before it reaches route handlers.
 * It verifies the JWT signature and expiry — it deliberately does NOT hit the
 * database, because a full session check belongs in the route handler.
 *
 * The verified identity is forwarded as `x-auth-*` request headers so handlers
 * can read it cheaply. Handlers must still treat these as hints, not as proof —
 * the database remains the source of truth (see `/api/v1/auth/me`).
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Public routes skip authentication entirely.
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // 2. Every other matched route requires a valid access token.
  const token = extractAccessToken(request);

  if (!token) {
    return unauthorizedResponse();
  }

  let payload: { sub: string; role: string };

  try {
    payload = await verifyAccessToken(token);
  } catch {
    // Expired, tampered, or wrong issuer — collapse to a single 401 so the
    // response shape does not reveal which failure mode occurred.
    return unauthorizedResponse();
  }

  // 3. Admin-only areas need an elevated role. This is intentionally a
  //    prefix match so any future `/api/v1/admin/*` route is protected by
  //    default without touching this list.
  if (isAdminPath(pathname) && !ADMIN_ROLES.has(payload.role)) {
    return forbiddenResponse();
  }

  // 4. Forward verified identity to the route handler.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-auth-user-id", payload.sub);
  requestHeaders.set("x-auth-role", payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

/**
 * Restricts the proxy to versioned API routes only.
 *
 * Why:
 * Without a matcher, proxy would run on every request — including static
 * assets, image optimizations, and the Swagger UI — adding latency to
 * traffic that has nothing to do with authentication.
 *
 * Excludes:
 *   - `/api-docs` — the public OpenAPI document.
 *   - Next.js internal assets and static files.
 */
export const config = {
  matcher: [
    /*
     * Match all `/api/v1/*` routes except:
     *   - `/api/v1/health` — handled inside PUBLIC_PATHS, but kept here so
     *     future non-v1 health probes also work.
     */
    "/api/v1/:path*",
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
