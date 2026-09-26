import type { z } from "zod";

import type {
  NotificationChannel,
  NotificationStatus,
} from "@/generated/prisma/client";

import type { listNotificationsQuerySchema } from "./notification.schema";

export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;

/** Public shape of an in-app notification. */
export interface PublicNotification {
  id: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  data: Record<string, unknown> | null;
  readAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
}

export interface PaginatedNotifications {
  items: PublicNotification[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Payload handed to a provider.
 *
 * Why:
 * Providers should not need to know about the notification row's id or
 * status. They receive the recipient, the content, and the arbitrary
 * per-channel data block. This keeps providers easily testable and swappable.
 */
export interface NotificationPayload {
  userId: string;
  recipient: string | null;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
}

/** Result reported by a provider after attempting delivery. */
export interface ProviderResult {
  delivered: boolean;
  /** Human-readable reason when delivery was skipped or failed. */
  reason?: string;
}
