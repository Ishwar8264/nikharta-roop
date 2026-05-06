import {
  NOTIFICATION_CODES,
  NOTIFICATION_MESSAGES,
} from "@/features/notifications/constants/notification.constants";
import { toPublicNotification } from "@/features/notifications/helpers/notification.mapper";
import { notificationJson } from "@/features/notifications/responses/notification.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Wraps a notification write result in the shared response shape.
 */
export function notificationWriteResponse(
  notification: Parameters<typeof toPublicNotification>[0],
  code: string,
) {
  const created = code === NOTIFICATION_CODES.NOTIFICATION_CREATED;
  return notificationJson({
    code,
    data: { notification: toPublicNotification(notification) },
    message: created
      ? NOTIFICATION_MESSAGES.NOTIFICATION_CREATED
      : NOTIFICATION_MESSAGES.NOTIFICATION_UPDATED,
    status: created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK,
    success: true,
  });
}
