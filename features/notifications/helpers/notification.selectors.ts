import type { Prisma } from "@prisma/client";

/**
 * Selects notification fields exposed by admin and user APIs.
 */
export const notificationSelect = () =>
  ({
    bookingId: true,
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    channel: true,
    createdAt: true,
    errorMessage: true,
    failedAt: true,
    id: true,
    messageHi: true,
    metadata: true,
    provider: true,
    providerMessageId: true,
    recipient: true,
    retryCount: true,
    scheduledAt: true,
    sentAt: true,
    status: true,
    templateKey: true,
    trigger: true,
    updatedAt: true,
    user: { select: { id: true, mobile: true, name: true } },
    userId: true,
  }) satisfies Prisma.NotificationSelect;
