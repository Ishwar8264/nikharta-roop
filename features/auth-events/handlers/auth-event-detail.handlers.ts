import { getDb } from "@/db";
import {
  AUTH_EVENT_CODES,
  AUTH_EVENT_MESSAGES,
} from "@/features/auth-events/constants/auth-event.constants";
import { toPublicAuthEvent } from "@/features/auth-events/helpers/auth-event.mapper";
import { authEventSelect } from "@/features/auth-events/helpers/auth-event.selectors";
import { authEventJson } from "@/features/auth-events/responses/auth-event.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { handleAuthEventError, throwAuthEventNotFound } from "./auth-event.errors";
import { throwAuthEventForbidden } from "./auth-event.scopes";
import { requireAuthEventAdmin, type AuthEventAdminUser } from "./auth-event.shared";

/**
 * Handles admin auth event detail requests.
 */
export async function handleGetAuthEvent(request: Request, eventId: string) {
  const auth = await requireAuthEventAdmin(request);
  if (!auth.success) return auth.error;
  return getAuthEvent(eventId, auth.session.user);
}

/**
 * Loads one auth event while hiding cross-branch audit data from branch admins.
 */
async function getAuthEvent(eventId: string, admin: AuthEventAdminUser) {
  try {
    if (admin.role !== "SUPER_ADMIN" && !admin.branchId) throwAuthEventForbidden();
    const event = await getDb().authEvent.findFirst({
      select: authEventSelect(),
      where: {
        id: eventId,
        user: admin.role === "SUPER_ADMIN" ? undefined : { branchId: admin.branchId },
      },
    });
    if (!event) throwAuthEventNotFound();
    return authEventJson({
      code: AUTH_EVENT_CODES.EVENT_LOADED,
      data: { event: toPublicAuthEvent(event) },
      message: AUTH_EVENT_MESSAGES.EVENT_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleAuthEventError(error, {
      code: AUTH_EVENT_CODES.EVENT_LOAD_FAILED,
      handler: "getAuthEvent",
      message: AUTH_EVENT_MESSAGES.EVENT_LOAD_FAILED,
    });
  }
}
