"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { REFRESH_COOKIE_NAME } from "@/server/auth/auth.constants";
import { revokeRefreshToken } from "@/server/auth/token.service";

/**
 * Server Action: ends the session and purges the client router cache.
 *
 * Why a Server Action instead of the route handler:
 * Route Handlers can clear cookies but cannot invalidate Next.js's client-side
 * Router Cache. Server Actions can — and `revalidatePath("/", "layout")` tells
 * Next.js to discard every cached RSC payload for every route. The next
 * navigation therefore always fetches a fresh render, which is exactly what
 * an auth boundary change requires.
 *
 * Why "/" with type "layout":
 * The root layout wraps every page and reads the session. Purging it purges
 * the whole tree, so the header, user menu, and any server component that
 * depends on the user re-render with the new (signed-out) state.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshToken) {
    try {
      await revokeRefreshToken(refreshToken);
    } catch {
      // Best-effort. Cookies are cleared regardless.
    }
  }

  // clearSessionCookies takes a NextResponse, not a cookie store — so we
  // clear them through the cookie store directly here.
  cookieStore.delete(REFRESH_COOKIE_NAME);
  cookieStore.delete("accessToken");
  cookieStore.delete("csrfToken");

  revalidatePath("/", "layout");
}
