import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAMES = {
  REFRESH: "nr_refresh",
  SESSION: "nr_session",
} as const;

const SIGNIN_PATH = "/signin";
const SIGNUP_PATH = "/signup";
const DEFAULT_AUTHENTICATED_PATH = "/account";

const AUTH_ENTRY_PATHS = new Set([SIGNIN_PATH, SIGNUP_PATH]);

const PUBLIC_ROUTE_EXACT_PATHS = new Set([
  "/",
  "/blogs",
  "/branches",
  "/offers",
  "/packages",
  "/portfolio",
  "/services",
]);

const PUBLIC_ROUTE_PREFIXES = [
  "/blogs",
  "/branches",
  "/offers",
  "/packages",
  "/portfolio",
  "/services",
] as const;

const PRIVATE_ROUTE_EXACT_PATHS = new Set(["/account"]);

const PRIVATE_ROUTE_PREFIXES = ["/account"] as const;

const ADMIN_ROUTE_EXACT_PATHS = new Set(["/admin"]);

const ADMIN_ROUTE_PREFIXES = ["/admin", "/api/v1/admin"] as const;

const SUPER_ADMIN_ROUTE_EXACT_PATHS = new Set([
  "/admin/auth-events",
  "/admin/users",
]);

const SUPER_ADMIN_ROUTE_PREFIXES = [
  "/admin/auth-events",
  "/admin/users",
  "/api/v1/admin/auth-events",
  "/api/v1/admin/users",
] as const;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = hasBrowserAuthCookie(request);

  if (isAuthenticatedRoute(pathname) && !hasAuthCookie) {
    if (isApiPath(pathname)) {
      return unauthorizedJson();
    }

    return redirectToSignin(request);
  }

  if (AUTH_ENTRY_PATHS.has(pathname) && hasAuthCookie) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_PATH, request.url));
  }

  if (AUTH_ENTRY_PATHS.has(pathname) || isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/account/:path*",
    "/admin/:path*",
    "/api/v1/admin/:path*",
    "/blogs",
    "/blogs/:path*",
    "/branches",
    "/branches/:path*",
    "/offers",
    "/offers/:path*",
    "/packages",
    "/packages/:path*",
    "/portfolio",
    "/portfolio/:path*",
    "/services",
    "/services/:path*",
    "/signin",
    "/signup",
  ],
};

function hasBrowserAuthCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get(AUTH_COOKIE_NAMES.SESSION)?.value ||
      request.cookies.get(AUTH_COOKIE_NAMES.REFRESH)?.value,
  );
}

function isPublicRoute(pathname: string) {
  return matchesPathGroup(
    pathname,
    PUBLIC_ROUTE_EXACT_PATHS,
    PUBLIC_ROUTE_PREFIXES,
  );
}

function isAuthenticatedRoute(pathname: string) {
  return (
    isPrivateRoute(pathname) ||
    isAdminRoute(pathname) ||
    isSuperAdminRoute(pathname)
  );
}

function isPrivateRoute(pathname: string) {
  return matchesPathGroup(
    pathname,
    PRIVATE_ROUTE_EXACT_PATHS,
    PRIVATE_ROUTE_PREFIXES,
  );
}

function isAdminRoute(pathname: string) {
  return matchesPathGroup(
    pathname,
    ADMIN_ROUTE_EXACT_PATHS,
    ADMIN_ROUTE_PREFIXES,
  );
}

function isSuperAdminRoute(pathname: string) {
  return matchesPathGroup(
    pathname,
    SUPER_ADMIN_ROUTE_EXACT_PATHS,
    SUPER_ADMIN_ROUTE_PREFIXES,
  );
}

function matchesPathGroup(
  pathname: string,
  exactPaths: ReadonlySet<string>,
  prefixes: readonly string[],
) {
  if (exactPaths.has(pathname)) {
    return true;
  }

  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

function redirectToSignin(request: NextRequest) {
  const url = new URL(SIGNIN_PATH, request.url);
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(url);
}

function unauthorizedJson() {
  return NextResponse.json(
    {
      code: "AUTH_REQUIRED",
      message: "Please sign in to continue.",
      success: false,
    },
    { status: 401 },
  );
}
