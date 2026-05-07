import {
  AUTH_EVENT_CODES,
  AUTH_EVENT_MESSAGES,
} from "@/features/auth-events/constants/auth-event.constants";
import { authEventError } from "@/features/auth-events/responses/auth-event.responses";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type AuthEventAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach auth event handlers.
 */
export async function requireAuthEventAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: authEventError({
        code: AUTH_EVENT_CODES.FORBIDDEN,
        message: AUTH_EVENT_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Carries expected auth event errors across helper boundaries.
 */
export class AuthEventVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
