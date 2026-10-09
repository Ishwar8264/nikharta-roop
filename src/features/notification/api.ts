/**
 * Client-side API wrappers for the notification inbox feature.
 *
 * Why a dedicated module:
 * The notification service is server-only. These wrappers route through the
 * shared `api` client so CSRF + cookie auth + refresh-on-401 are handled by
 * `backend.client`. The browser hits these endpoints; server pages call the
 * service directly.
 */

import { api } from "@/lib/api/backend.client";

import type {
  NotificationChannel,
  PaginatedNotificationsWire,
  PublicNotificationWire,
} from "./types";

type ListResponse = {
  message: string;
  data: PublicNotificationWire[];
  meta: { nextCursor: string | null; hasMore: boolean };
};

type UnreadCountResponse = {
  message: string;
  data: { count: number };
};

type MarkReadResponse = {
  message: string;
  data: { notification: PublicNotificationWire };
};

type MarkAllReadResponse = {
  message: string;
  data: { count: number };
};

/** Lists the caller's inbox. */
export function listNotificationsApi(query: {
  cursor?: string;
  limit?: number;
  channel?: NotificationChannel;
  unreadOnly?: boolean;
} = {}) {
  const params = new URLSearchParams();
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.channel) params.set("channel", query.channel);
  if (query.unreadOnly !== undefined) {
    params.set("unreadOnly", String(query.unreadOnly));
  }
  const qs = params.toString();
  return api.get<ListResponse>(`/notifications${qs ? `?${qs}` : ""}`);
}

/** Returns the caller's unread notification count. */
export function getUnreadCountApi() {
  return api.get<UnreadCountResponse>("/notifications/unread-count");
}

/** Marks one notification as read. */
export function markNotificationReadApi(notificationId: string) {
  return api.patch<MarkReadResponse>(
    `/notifications/${encodeURIComponent(notificationId)}`,
    {},
  );
}

/** Marks every unread notification as read. Returns the count updated. */
export function markAllNotificationsReadApi() {
  return api.patch<MarkAllReadResponse>("/notifications/read-all", {});
}

/** Deletes one notification. */
export function deleteNotificationApi(notificationId: string) {
  return api.delete<{ message: string; data: null }>(
    `/notifications/${encodeURIComponent(notificationId)}`,
  );
}

/** Convenience: shape the list response into the wire pagination tuple. */
export function toPaginated(
  response: ListResponse,
): PaginatedNotificationsWire {
  return {
    items: response.data,
    nextCursor: response.meta.nextCursor,
    hasMore: response.meta.hasMore,
  };
}
