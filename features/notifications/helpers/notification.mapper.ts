export type NotificationRow = {
  bookingId: string | null;
  branch: Record<string, unknown> | null;
  branchId: string | null;
  channel: string;
  createdAt: Date;
  errorMessage: string | null;
  failedAt: Date | null;
  id: string;
  messageHi: string;
  metadata: unknown;
  provider: string | null;
  providerMessageId: string | null;
  recipient: string;
  retryCount: number;
  scheduledAt: Date | null;
  sentAt: Date | null;
  status: string;
  templateKey: string | null;
  trigger: string;
  updatedAt: Date;
  user: Record<string, unknown> | null;
  userId: string | null;
};

/**
 * Converts a notification row into the API shape.
 */
export function toPublicNotification(notification: NotificationRow) {
  return notification;
}
