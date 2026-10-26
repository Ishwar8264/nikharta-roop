import { NextResponse, type NextRequest } from "next/server";

import { routes } from "@/config/routes";
import { rateLimitHeaders, standardLimiter } from "@/lib/rate-limit";

const FULLY_PUBLIC_PATHS = new Set<string>([
  "/api/v1/health",
  "/api/v1/coupons/validate",
  "/api/v1/cron/appointment-reminders",
  "/api/v1/cron/notification-retry",
]);

const PUBLIC_GET_PATHS = new Set<string>([
  "/api/v1/salons",
  "/api/v1/services/categories",
  "/api/v1/products/categories",
  "/api/v1/blog/posts",
  "/api/v1/blog/categories",
  "/api/v1/blog/tags",
  "/api/v1/coupons/validate",
  "/api/v1/catalog/templates",
]);

const PUBLIC_GET_PATTERNS: RegExp[] = [
  /^\/api\/v1\/salons\/[^/]+$/,
  /^\/api\/v1\/salons\/[^/]+\/services$/,
  /^\/api\/v1\/salons\/[^/]+\/services\/[^/]+$/,
  /^\/api\/v1\/salons\/[^/]+\/services\/[^/]+\/staff$/,
  /^\/api\/v1\/salons\/[^/]+\/products$/,
  /^\/api\/v1\/salons\/[^/]+\/products\/[^/]+$/,
  /^\/api\/v1\/salons\/[^/]+\/working-hours$/,
  /^\/api\/v1\/salons\/[^/]+\/availability$/,
  /^\/api\/v1\/salons\/[^/]+\/templates$/,
  /^\/api\/v1\/salons\/[^/]+\/packages$/,
  /^\/api\/v1\/salons\/[^/]+\/packages\/[^/]+$/,
  /^\/api\/v1\/services\/[^/]+\/reviews$/,
  /^\/api\/v1\/products\/[^/]+\/reviews$/,
  /^\/api\/v1\/staff\/[^/]+\/ratings$/,
  /^\/api\/v1\/blog\/posts\/[^/]+$/,
  /^\/api\/v1\/blog\/posts\/[^/]+\/comments$/,
  /^\/api\/v1\/coupons\/[^/]+$/,
];

function isPublicRequest(pathname: string, method: string): boolean {
  if (FULLY_PUBLIC_PATHS.has(pathname)) return true;
  if (method !== "GET" && method !== "HEAD") return false;
  return PUBLIC_GET_PATHS.has(pathname) ||
    PUBLIC_GET_PATTERNS.some((pattern) => pattern.test(pathname));
}

/** Keeps public reads available and rejects every protected request fail-closed. */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (isPublicRequest(request.nextUrl.pathname, request.method)) {
    if (request.nextUrl.pathname === "/api/v1/health") return NextResponse.next();

    const result = await standardLimiter.limit(clientIp(request));
    if (!result.success) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(result) },
      );
    }
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { message: "Authentication is temporarily unavailable" },
      { status: 401 },
    );
  }

  return NextResponse.redirect(new URL(routes.login, request.url));
}

function clientIp(request: NextRequest): string {
  const platformIp = (request as NextRequest & { ip?: string }).ip;
  if (platformIp) return platformIp;
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";
}

export const config = {
  matcher: [
    "/api/v1/:path*",
    "/dashboard/:path*",
    "/appointments/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/settings/:path*",
    "/favorites/:path*",
    "/loyalty/:path*",
  ],
};
