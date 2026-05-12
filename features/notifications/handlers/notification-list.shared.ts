import { z } from "zod";

import {
  NOTIFICATION_CODES,
  NOTIFICATION_MESSAGES,
} from "@/features/notifications/constants/notification.constants";
import type { NotificationRow } from "@/features/notifications/helpers/notification.mapper";
import { toPublicNotification } from "@/features/notifications/helpers/notification.mapper";
import { notificationError, notificationJson } from "@/features/notifications/responses/notification.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses notification query strings with feature-owned validation errors.
 */
export function parseNotificationQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: notificationError({
      code: NOTIFICATION_CODES.VALIDATION_ERROR,
      message: NOTIFICATION_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a notification collection in the shared response shape.
 */
export function notificationListResponse(notifications: NotificationRow[], limit: number) {
  return notificationJson({
    code: NOTIFICATION_CODES.NOTIFICATION_LISTED,
    data: { limit, notifications: notifications.map(toPublicNotification) },
    message: NOTIFICATION_MESSAGES.NOTIFICATION_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
