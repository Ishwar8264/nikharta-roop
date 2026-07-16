// Load cookie names shared with Proxy and authentication route handlers.
import {
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_SESSION_HINT_COOKIE_NAME,
} from "@/src/constants/auth";
// Load the role-home map used after a server-side authorization failure.
import {
  ROLE_HOME_PATHS,
  type UserRole,
} from "@/src/constants/authorization";
// Load focused database-backed browser session validation.
import { validateBrowserSessionService } from "@/src/services/auth/auth-session.service";
// Read protected HttpOnly cookies inside Server Component layouts.
import { cookies } from "next/headers";
// Redirect before protected layout content is returned to the browser.
import { redirect } from "next/navigation";

// Require a current server session and role before a protected layout renders.
export const requireRolePage = async (allowedRoles: readonly UserRole[]) => {
  // Read the request-scoped cookie store only on the server.
  const cookieStore = await cookies();

  // Validate both supported browser proofs against their persisted database sessions.
  const session = await validateBrowserSessionService({
    accessToken: cookieStore.get(AUTH_ACCESS_COOKIE_NAME)?.value,
    sessionHint: cookieStore.get(AUTH_SESSION_HINT_COOKIE_NAME)?.value,
  });

  // Stop unauthenticated and revoked sessions before protected children execute.
  if (!session) {
    redirect("/login");
  }

  // Redirect authenticated users away from layouts outside their current role hierarchy.
  if (!allowedRoles.includes(session.role)) {
    redirect(ROLE_HOME_PATHS[session.role]);
  }

  // Return trusted current database claims for server-selected navigation.
  return session;
};
