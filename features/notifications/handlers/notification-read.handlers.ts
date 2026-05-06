import { getDb } from "@/db";
import {
  NOTIFICATION_CODES,
  NOTIFICATION_MESSAGES,
} from "@/features/notifications/constants/notification.constants";
import { notificationSelect } from "@/features/notifications/helpers/notification.selectors";
import { notificationJson } from "@/features/notifications/responses/notification.responses";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { handleNotificationError, throwNotificationNotFound } from "./notification.errors";
import { toPublicNotification } from "../helpers/notification.mapper";

/**
 * Handles current user's notification read acknowledgements.
 */
export async function handleMarkNotificationRead(
  request: Request,
  notificationId: string,
) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth.error;
  try {
    const current = await getDb().notification.findFirst({
      where: { id: notificationId, userId: auth.session.userId },
    });
    if (!current) throwNotificationNotFound();
    const metadata = {
      ...(isObject(current.metadata) ? current.metadata : {}),
      readAt: new Date().toISOString(),
    };
    const notification = await getDb().notification.update({
      data: { metadata },
      select: notificationSelect(),
      where: { id: notificationId },
    });
    return notificationJson({
      code: NOTIFICATION_CODES.NOTIFICATION_MARKED_READ,
      data: { notification: toPublicNotification(notification) },
      message: NOTIFICATION_MESSAGES.NOTIFICATION_MARKED_READ,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleNotificationError(error, {
      code: NOTIFICATION_CODES.NOTIFICATION_MARK_READ_FAILED,
      handler: "handleMarkNotificationRead",
      message: NOTIFICATION_MESSAGES.NOTIFICATION_MARK_READ_FAILED,
    });
  }
}

/**
 * Narrows JSON metadata into a plain object before merging read state.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
