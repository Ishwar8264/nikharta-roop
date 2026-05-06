import { getDb } from "@/db";
import {
  NOTIFICATION_CODES,
  NOTIFICATION_MESSAGES,
} from "@/features/notifications/constants/notification.constants";
import { notificationSelect } from "@/features/notifications/helpers/notification.selectors";
import {
  createNotificationSchema,
  updateNotificationSchema,
  type CreateNotificationInput,
  type UpdateNotificationInput,
} from "@/schema/notifications/schema.notification";
import { handleNotificationError, throwNotificationNotFound } from "./notification.errors";
import { loadManageableNotification } from "./notification.scopes";
import {
  parseNotificationBody,
  requireNotificationAdmin,
  type NotificationAdminUser,
} from "./notification.shared";
import { notificationWriteResponse } from "./notification-write.responses";

/**
 * Handles admin notification creation requests.
 */
export async function handleCreateNotification(request: Request) {
  const auth = await requireNotificationAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseNotificationBody(request, createNotificationSchema);
  if (body.error) return body.error;
  return createNotification(body.data);
}

/**
 * Handles admin notification patch requests.
 */
export async function handleUpdateNotification(request: Request, notificationId: string) {
  const auth = await requireNotificationAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseNotificationBody(request, updateNotificationSchema);
  if (body.error) return body.error;
  return updateNotification(notificationId, body.data, auth.session.user);
}

/**
 * Creates one queued notification record for provider delivery.
 */
async function createNotification(input: CreateNotificationInput) {
  try {
    const notification = await getDb().notification.create({
      data: input,
      select: notificationSelect(),
    });
    return notificationWriteResponse(notification, NOTIFICATION_CODES.NOTIFICATION_CREATED);
  } catch (error) {
    return handleNotificationError(error, {
      code: NOTIFICATION_CODES.NOTIFICATION_CREATE_FAILED,
      handler: "createNotification",
      message: NOTIFICATION_MESSAGES.NOTIFICATION_CREATE_FAILED,
    });
  }
}

/**
 * Updates delivery metadata or retry fields for one notification.
 */
async function updateNotification(
  notificationId: string,
  input: UpdateNotificationInput,
  admin: NotificationAdminUser,
) {
  try {
    const current = await loadManageableNotification(notificationId, admin);
    if (!current) throwNotificationNotFound();
    const notification = await getDb().notification.update({
      data: input,
      select: notificationSelect(),
      where: { id: notificationId },
    });
    return notificationWriteResponse(notification, NOTIFICATION_CODES.NOTIFICATION_UPDATED);
  } catch (error) {
    return handleNotificationError(error, {
      code: NOTIFICATION_CODES.NOTIFICATION_UPDATE_FAILED,
      handler: "updateNotification",
      message: NOTIFICATION_MESSAGES.NOTIFICATION_UPDATE_FAILED,
    });
  }
}
