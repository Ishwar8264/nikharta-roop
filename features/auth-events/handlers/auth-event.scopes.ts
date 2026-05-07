import {
  AUTH_EVENT_CODES,
  AUTH_EVENT_MESSAGES,
} from "@/features/auth-events/constants/auth-event.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { AuthEventVisibleError, type AuthEventAdminUser } from "./auth-event.shared";

/**
 * Resolves the branch scope allowed for admin auth event list requests.
 */
export function resolveAuthEventBranch(
  requestedBranchId: string | undefined,
  admin: AuthEventAdminUser,
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throwAuthEventForbidden();
}

/**
 * Throws a branch-scope authorization error.
 */
export function throwAuthEventForbidden(): never {
  throw new AuthEventVisibleError(
    AUTH_EVENT_CODES.FORBIDDEN,
    AUTH_EVENT_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
