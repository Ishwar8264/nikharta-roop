/**
 * Purpose: Shared authentication guard for Server Actions that call internal API handlers.
 * Responsibilities: load the current request user and return a small serializable auth result.
 * Important notes: route handlers still perform role and branch authorization after this guard.
 */
import "server-only";

import type { AuthUser } from "@/features/auth/actions/auth-action.types";
import { getCurrentUserFromRequest } from "@/features/auth/helpers/auth-session.server";

export type ServerActionAuthResult =
  | {
      message: string;
      success: false;
      user: null;
    }
  | {
      message: string;
      success: true;
      user: AuthUser;
    };

/**
 * Verifies that a Server Action caller has an authenticated browser session.
 *
 * Server Actions are public endpoints, so this guard exists before any internal
 * API handler call. Admin-specific role checks still live in the route handlers
 * to keep branch-scope rules centralized.
 */
export async function requireAuth(): Promise<ServerActionAuthResult> {
  const user = await getCurrentUserFromRequest();

  if (!user) {
    return {
      message: "Please login again before continuing.",
      success: false,
      user: null,
    };
  }

  return {
    message: "Authenticated.",
    success: true,
    user,
  };
}
