/**
 * Purpose: Server-only helpers for loading the current authenticated user from request cookies.
 * Responsibilities: forward cookies to auth handlers and return profile-safe user data for Server Components.
 * Important notes: this helper only reads cookies because layouts cannot write refreshed auth cookies.
 */
import "server-only";

import { cookies, headers } from "next/headers";

import type { AuthUser } from "@/features/auth/actions/auth-action.types";
import { handleMe } from "@/features/auth/handlers/auth.handlers";

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
 * Loads the current user for Server Component layouts.
 *
 * This helper intentionally only reads cookies. Next.js allows cookie writes
 * only inside Server Actions and Route Handlers, so layouts must not refresh or
 * clear auth cookies here.
 */
export async function getCurrentUserFromRequest() {
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
 * Builds the synthetic Request headers needed by auth route handlers.
 *
 * Cookies carry the session/refresh tokens. User agent and IP headers are
 * forwarded because auth handlers use them for session device metadata.
 */
async function createAuthRequestHeaders() {
  const [incomingHeaders, cookieStore] = await Promise.all([
    headers(),
    cookies(),
  ]);
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
