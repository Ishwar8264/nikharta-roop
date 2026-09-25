import "server-only";

import type {
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Columns returned for every public notification. */
const PUBLIC_NOTIFICATION_SELECT = {
  id: true,
  title: true,
  body: true,
  channel: true,
  status: true,
  data: true,
  readAt: true,
  sentAt: true,
  createdAt: true,
} as const satisfies Prisma.NotificationSelect;

/** Cursor-paginated inbox for a user. */
export async function listUserNotifications(
  userId: string,
  input: {
    cursor?: string;
    limit: number;
    channel?: NotificationChannel;
    unreadOnly?: boolean;
  },
) {
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(input.channel ? { channel: input.channel } : {}),
    ...(input.unreadOnly ? { readAt: null } : {}),
  };

  const rows = await prisma.notification.findMany({
    where,
    select: PUBLIC_NOTIFICATION_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Count of unread notifications for a user. */
export async function countUnreadNotifications(
  userId: string,
): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

/** Loads a single notification scoped to the caller. */
export async function findUserNotification(
  userId: string,
  notificationId: string,
) {
  return prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: PUBLIC_NOTIFICATION_SELECT,
  });
}

/** Creates a notification row. Used by the dispatcher. */
export async function createNotificationRow(data: {
  userId: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  data: string | null;
  sentAt: Date | null;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      body: data.body,
      channel: data.channel,
      status: data.status,
      data: data.data,
      sentAt: data.sentAt,
    },
    select: PUBLIC_NOTIFICATION_SELECT,
  });
}

/** Marks one notification as read. */
export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt: new Date(), status: "READ" },
  });
}

/** Marks every unread notification for a user as read. */
export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date(), status: "READ" },
  });
}

/** Deletes a notification owned by the caller. */
export async function deleteNotification(
  userId: string,
  notificationId: string,
): Promise<void> {
  await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });
}

/** Loads the recipient's contact details for email/SMS providers. */
export async function loadRecipientContact(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, phone: true, name: true },
  });
}
