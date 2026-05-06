import {
  NOTIFICATION_CODES,
  NOTIFICATION_MESSAGES,
} from "@/features/notifications/constants/notification.constants";
import { notificationError } from "@/features/notifications/responses/notification.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { NotificationVisibleError } from "./notification.shared";

/**
 * Converts expected and unexpected notification failures into safe responses.
 */
export function handleNotificationError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof NotificationVisibleError) {
    return notificationError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return notificationError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws a notification not-found error.
 */
export function throwNotificationNotFound(): never {
  throw new NotificationVisibleError(
    NOTIFICATION_CODES.NOTIFICATION_NOT_FOUND,
    NOTIFICATION_MESSAGES.NOTIFICATION_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
