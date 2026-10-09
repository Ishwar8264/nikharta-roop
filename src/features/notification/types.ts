/**
 * Browser-safe types for the notification inbox feature.
 *
 * Why mirror instead of importing from `src/server/**`:
 * The server `PublicNotification` type carries `Date` fields that JSON-
 * serialize to strings on the wire, and the notification service module is
 * `"server-only"`. Re-declaring the wire shape here keeps the client bundle
 * honest.
 */

/** Channels a notification can be dispatched on. */
export type NotificationChannel =
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "PUSH"
  | "IN_APP";

/** Lifecycle status of a notification row. */
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";

/** Mirrors `PublicNotification` — dates become ISO strings over JSON. */
export interface PublicNotificationWire {
  id: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  data: Record<string, unknown> | null;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

/** Cursor-paginated inbox response. */
export interface PaginatedNotificationsWire {
  items: PublicNotificationWire[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Props for the inbox client component. */
export interface NotificationInboxProps {
  initial: PublicNotificationWire[];
  initialUnreadCount: number;
  hasMore: boolean;
  nextCursor: string | null;
}
