import "server-only";

import { dispatchNotification } from "./notification.dispatcher";
import { NotificationNotFoundError } from "./notification.errors";
import {
  countUnreadNotifications,
  deleteNotification,
  findUserNotification,
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification.repository";
import { genericTemplate } from "./notification.templates";
import type {
  ListNotificationsQuery,
  PaginatedNotifications,
  PublicNotification,
} from "./notification.types";

/** Lists the caller's in-app notification inbox. */
export async function listNotifications(
  userId: string,
  query: ListNotificationsQuery,
): Promise<PaginatedNotifications> {
  const result = await listUserNotifications(userId, query);
  return {
    items: result.items.map((row) => ({
      ...row,
      data: row.data ? safeJsonParse(row.data) : null,
    })),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/** Returns the unread badge count. */
export async function getUnreadCount(userId: string): Promise<number> {
  return countUnreadNotifications(userId);
}

/** Marks one notification as read. */
export async function markAsRead(
  userId: string,
  notificationId: string,
): Promise<PublicNotification> {
  const existing = await findUserNotification(userId, notificationId);
  if (!existing) throw new NotificationNotFoundError();

  await markNotificationRead(userId, notificationId);
  const updated = await findUserNotification(userId, notificationId);
  if (!updated) throw new NotificationNotFoundError();

  return {
    ...updated,
    data: updated.data ? safeJsonParse(updated.data) : null,
  };
}

/** Marks all unread notifications as read. */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await markAllNotificationsRead(userId);
  return result.count;
}

/** Deletes a notification. */
export async function removeNotification(
  userId: string,
  notificationId: string,
): Promise<void> {
  const existing = await findUserNotification(userId, notificationId);
  if (!existing) throw new NotificationNotFoundError();
  await deleteNotification(userId, notificationId);
}

// ---------- High-level trigger functions ----------

/**
 * Notify a user with a title and body across the given channels.
 *
 * Why:
 * Callers (appointment, loyalty, etc.) should not know about the dispatcher
 * or the template engine. Each event has a dedicated helper below that
 * builds the content once and dispatches it on the channels that make sense.
 */
export async function notifyUser(input: {
  userId: string;
  title: string;
  body: string;
  channels?: Array<"EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "IN_APP">;
  data?: Record<string, unknown> | null;
}): Promise<void> {
  const channels = input.channels ?? ["IN_APP", "EMAIL"];
  await Promise.all(
    channels.map((channel) =>
      dispatchNotification({
        userId: input.userId,
        channel,
        title: input.title,
        body: input.body,
        data: input.data ?? null,
      }).catch((error) => {
        // A single channel failure must not stop the others.
        console.error(`Notification on ${channel} failed`, error);
      }),
    ),
  );
}

/** Fires when an appointment is confirmed. */
export async function notifyAppointmentConfirmed(input: {
  userId: string;
  salonName: string;
  startTime: string;
  services: string[];
}): Promise<void> {
  const template = genericTemplate({
    title: `Booking confirmed at ${input.salonName}`,
    body: `Your booking at ${input.salonName} is confirmed for ${input.startTime}.`,
  });
  await notifyUser({
    userId: input.userId,
    title: template.subject,
    body: template.text,
    channels: ["IN_APP", "EMAIL"],
    data: { type: "appointment.confirmed", ...input },
  });
}

/** Fires when an appointment is cancelled. */
export async function notifyAppointmentCancelled(input: {
  userId: string;
  salonName: string;
  startTime: string;
  reason: string | null;
}): Promise<void> {
  const title = `Booking at ${input.salonName} cancelled`;
  const body = input.reason
    ? `Your booking on ${input.startTime} was cancelled. Reason: ${input.reason}.`
    : `Your booking on ${input.startTime} was cancelled.`;
  await notifyUser({
    userId: input.userId,
    title,
    body,
    channels: ["IN_APP", "EMAIL"],
    data: { type: "appointment.cancelled", ...input },
  });
}

/** Fires when a customer earns loyalty points. */
export async function notifyLoyaltyEarned(input: {
  userId: string;
  points: number;
  balance: number;
}): Promise<void> {
  await notifyUser({
    userId: input.userId,
    title: `You earned ${input.points} loyalty points`,
    body: `Your new balance is ${input.balance} points.`,
    channels: ["IN_APP", "EMAIL"],
    data: { type: "loyalty.earned", ...input },
  });
}

/** Fires when a customer should leave a review. */
export async function notifyReviewRequest(input: {
  userId: string;
  salonName: string;
  appointmentId: string;
}): Promise<void> {
  await notifyUser({
    userId: input.userId,
    title: `How was your visit to ${input.salonName}?`,
    body: "Leave a review and help others discover great salons.",
    channels: ["IN_APP", "EMAIL"],
    data: { type: "review.request", ...input },
  });
}

/** Safe JSON parse — malformed data must not break listing. */
function safeJsonParse(input: string): Record<string, unknown> | null {
  try {
    return JSON.parse(input) as Record<string, unknown>;
  } catch {
    return null;
  }
}
