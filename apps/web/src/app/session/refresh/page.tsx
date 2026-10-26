"use client";

import { useEffect } from "react";

import { routes } from "@/config/routes";
import { refreshSession } from "@/lib/api/backend.client";

/**
 * Recovers an expired access cookie before returning to a protected page.
 *
 * Why a client page:
 * Next.js Server Components may read cookies but cannot rotate them. This
 * browser hop calls the refresh Route Handler, accepts its Set-Cookie headers,
 * and then performs a fresh document request with the new access token.
 */
export default function RefreshSessionPage() {
  useEffect(() => {
    let active = true;

    async function restoreSession(): Promise<void> {
      const refreshed = await refreshSession();
      if (!active) return;

      if (refreshed) {
        window.location.replace(getSafeDestination());
        return;
      }

      window.location.replace(getLoginDestination());
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <p className="text-muted-foreground" role="status" aria-live="polite">
        Restoring your session…
      </p>
    </main>
  );
}

/** Returns the original protected path without allowing an external redirect. */
function getSafeDestination(): string {
  const requested = new URLSearchParams(window.location.search).get("redirect");

  if (requested?.startsWith("/") && !requested.startsWith("//")) {
    return requested;
  }

  return routes.dashboard;
}

/** Preserves the protected destination for the next successful login. */
function getLoginDestination(): string {
  const loginUrl = new URL(routes.login, window.location.origin);
  loginUrl.searchParams.set("redirect", getSafeDestination());
  return `${loginUrl.pathname}${loginUrl.search}`;
}
