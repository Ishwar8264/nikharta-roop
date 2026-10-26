"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect } from "react";

import {
  authDevLog,
  getLastRefreshTime,
  refreshSession,
} from "@/lib/api/backend.client";

import type { CurrentUser } from "../shared/types";

const PROACTIVE_REFRESH_INTERVAL_MS = 12 * 60 * 1000;

interface AuthContextValue {
  user: CurrentUser | null;
}

const AuthContext = createContext<AuthContextValue>({ user: null });

/**
 * Provides the current user to client components and bridges token-refresh
 * events back into a server re-render.
 *
 * Why it takes the user as a prop (not fetches it):
 * The session lives in an HttpOnly cookie — the client cannot read it. The
 * only reliable source is the server, so the root layout resolves the user
 * and passes it down. No /auth/me fetch, no loading flash, no duplicate
 * source of truth.
 *
 * Why it listens for `auth:refreshed`:
 * When the api client silently refreshes an expired access token, the server
 * has new cookies but the currently-rendered Server Components do not. This
 * listener calls router.refresh() so any server-rendered surface (header
 * avatar, personalized content) re-renders with the updated session.
 */
export function AuthProvider({
  user,
  children,
}: {
  user: CurrentUser | null;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    function handleRefreshed() {
      router.refresh();
    }

    window.addEventListener("auth:refreshed", handleRefreshed);
    return () => window.removeEventListener("auth:refreshed", handleRefreshed);
  }, [router]);

  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    function scheduleNextRefresh(): void {
      if (!active) return;

      if (timeoutId) clearTimeout(timeoutId);

      const lastRefreshAt = getLastRefreshTime();
      const delay = lastRefreshAt
        ? Math.max(
            0,
            lastRefreshAt + PROACTIVE_REFRESH_INTERVAL_MS - Date.now(),
          )
        : 0;

      authDevLog("proactive_refresh_scheduled", { delayMs: delay });
      timeoutId = setTimeout(() => void refreshIfDue(), delay);
    }

    async function refreshIfDue(): Promise<void> {
      if (!active) return;

      const lastRefreshAt = getLastRefreshTime();
      const isDue =
        lastRefreshAt === null ||
        Date.now() - lastRefreshAt >= PROACTIVE_REFRESH_INTERVAL_MS;

      if (!isDue) {
        scheduleNextRefresh();
        return;
      }

      authDevLog("proactive_refresh_due", {
        pageVisible: document.visibilityState === "visible",
      });

      const refreshed = await refreshSession();
      if (!active) return;

      if (refreshed) {
        scheduleNextRefresh();
        return;
      }

      // A network failure should not destroy a valid session. Retry soon;
      // definitive 401 handling remains owned by the API client/recovery page.
      authDevLog("proactive_refresh_retry_scheduled");
      timeoutId = setTimeout(() => void refreshIfDue(), 30_000);
    }

    function handlePageActive(): void {
      if (document.visibilityState !== "visible") return;
      void refreshIfDue();
    }

    scheduleNextRefresh();
    window.addEventListener("focus", handlePageActive);
    document.addEventListener("visibilitychange", handlePageActive);

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener("focus", handlePageActive);
      document.removeEventListener("visibilitychange", handlePageActive);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

/** Reads the current user from context. Never null inside a signed-in tree. */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
