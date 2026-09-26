import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { ACCESS_COOKIE_NAME } from "@/server/auth/auth.constants";
import { verifyAccessToken } from "@/server/auth/jwt";
import { getCurrentUser } from "@/server/modules/auth/auth.service";
import type { CurrentUser } from "@/server/modules/auth/auth.types";

/**
 * Server-side session reader for Server Components.
 *
 * Why this exists separately from server/auth/session.ts:
 * That helper reads from a `Request` object (Route Handlers). Server
 * Components never see a Request — their only cookie source is `cookies()`
 * from next/headers. Two different APIs, one purpose.
 *
 * Why wrapped in cache():
 * React's `cache()` deduplicates calls within a single render pass. If both
 * the header and the page call getSession() in the same request, only one
 * cookie read and one DB query happen. Without this, a deeply nested tree
 * could issue N identical queries.
 *
 * Why we don't refresh here:
 * Server Components cannot set cookies — only Route Handlers and Server
 * Actions can. If the access token is expired, we return null and let the
 * client hit a 401, refresh, and call router.refresh() to re-render this
 * tree with fresh cookies.
 */
export const getSession = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { sub } = await verifyAccessToken(token);
    // Always re-read from DB so role changes and soft-deletes take effect
    // immediately instead of waiting for the short-lived token to expire.
    return await getCurrentUser(sub);
  } catch {
    // Expired, tampered, wrong issuer, or user deleted — all collapse to
    // "not signed in". We never surface the underlying jose error.
    return null;
  }
});
