import type { Prisma } from "@prisma/client";

import { notificationSelect } from "./notification.selectors";

export type NotificationRow = Prisma.NotificationGetPayload<{
  select: ReturnType<typeof notificationSelect>;
}>;

/**
 * Converts a notification row into the API shape.
 */
export function toPublicNotification(notification: NotificationRow) {
  return notification;
}
