import "server-only";

import { cookies, headers } from "next/headers";

import type { AuthUser } from "@/features/auth/actions/auth-action.types";
import { AUTH_COOKIE_NAMES } from "@/features/auth/helpers/auth.cookies";
import {
  handleMe,
  handleRefreshSession,
} from "@/features/auth/handlers/auth.handlers";

type AuthResponsePayload = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    session?: {
      expiresAt?: string;
    };
    user?: AuthUser;
  } | null;
  success?: boolean;
};

/**
 * Loads the current user for protected server layouts.
 *
 * It first checks the access/session cookie with `/auth/me`. If that cookie is
 * stale but the refresh cookie is still valid, it rotates the cookies through
 * `/auth/refresh` and retries `/auth/me` once. Client components never call the
 * auth API directly in this flow.
 */
export async function getCurrentUserWithRefresh() {
  const firstAttempt = await getCurrentUserOnce();

  if (firstAttempt) {
    return firstAttempt;
  }

  const refreshed = await refreshBrowserSession();

  if (!refreshed) {
    return null;
  }

  return getCurrentUserOnce();
}

/**
 * Calls the existing `handleMe` route handler with the current request cookies.
 *
 * Reusing the handler keeps the same auth rules for API consumers, layouts, and
 * Server Actions while avoiding a browser-visible `/api/v1/auth/me` request.
 */
async function getCurrentUserOnce() {
  const requestHeaders = await createAuthRequestHeaders();

  if (!requestHeaders.has("cookie")) {
    return null;
  }

  const response = await handleMe(
    new Request("http://nikharta-roop.local/auth-session/me", {
      headers: requestHeaders,
      method: "GET",
    }),
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as
    | AuthResponsePayload
    | null;

  return payload?.success ? payload.data?.user ?? null : null;
}

/**
 * Rotates auth cookies using the refresh cookie.
 *
 * `handleRefreshSession` returns token data in its response body for API/mobile
 * clients. Server layouts must explicitly write those tokens into Next cookies
 * so the browser receives the rotated HttpOnly cookies.
 */
async function refreshBrowserSession() {
  const requestHeaders = await createAuthRequestHeaders();

  if (!requestHeaders.has("cookie")) {
    return false;
  }

  const response = await handleRefreshSession(
    new Request("http://nikharta-roop.local/auth-session/refresh", {
      body: JSON.stringify({}),
      headers: requestHeaders,
      method: "POST",
    }),
  );

  if (!response.ok) {
    await clearBrowserAuthCookies();

    return false;
  }

  const payload = (await response.json().catch(() => null)) as
    | AuthResponsePayload
    | null;

  if (!payload?.success || !payload.data) {
    await clearBrowserAuthCookies();

    return false;
  }

  await persistBrowserAuthCookies(payload);

  return true;
}

/**
 * Builds the synthetic Request headers needed by auth route handlers.
 *
 * Cookies carry the session/refresh tokens. User agent and IP headers are
 * forwarded because auth handlers use them for session device metadata.
 */
async function createAuthRequestHeaders() {
  const incomingHeaders = await headers();
  const cookieStore = await cookies();
  const requestHeaders = new Headers();

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");

  if (cookieHeader) {
    requestHeaders.set("cookie", cookieHeader);
  }

  requestHeaders.set("content-type", "application/json");

  const userAgent = incomingHeaders.get("user-agent");
  const forwardedFor = incomingHeaders.get("x-forwarded-for");
  const realIp = incomingHeaders.get("x-real-ip");

  if (userAgent) {
    requestHeaders.set("user-agent", userAgent);
  }

  if (forwardedFor) {
    requestHeaders.set("x-forwarded-for", forwardedFor);
  }

  if (realIp) {
    requestHeaders.set("x-real-ip", realIp);
  }

  return requestHeaders;
}

/**
 * Stores refreshed access/refresh tokens as HttpOnly browser cookies.
 */
async function persistBrowserAuthCookies(payload: AuthResponsePayload) {
  const { accessToken, refreshToken, session } = payload.data ?? {};
  const expiresAt = session?.expiresAt ? new Date(session.expiresAt) : null;

  if (!accessToken || !refreshToken || !expiresAt) {
    await clearBrowserAuthCookies();

    return;
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  cookieStore.set(AUTH_COOKIE_NAMES.SESSION, accessToken, cookieOptions);
  cookieStore.set(AUTH_COOKIE_NAMES.REFRESH, refreshToken, cookieOptions);
}

/**
 * Clears stale auth cookies when refresh fails.
 */
async function clearBrowserAuthCookies() {
  const cookieStore = await cookies();
  const clearOptions = {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  cookieStore.set(AUTH_COOKIE_NAMES.SESSION, "", clearOptions);
  cookieStore.set(AUTH_COOKIE_NAMES.REFRESH, "", clearOptions);
}
