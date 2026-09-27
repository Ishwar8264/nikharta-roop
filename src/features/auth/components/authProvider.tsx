"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect } from "react";

import type { CurrentUser } from "../shared/types";

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

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

/** Reads the current user from context. Never null inside a signed-in tree. */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
