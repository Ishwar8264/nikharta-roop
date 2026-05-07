import type { Prisma } from "@prisma/client";

/**
 * Selects refund fields exposed by admin APIs.
 */
export const refundSelect = () =>
  ({
    amount: true,
    booking: {
      select: { bookingDate: true, branchId: true, displayId: true, id: true, status: true },
    },
    bookingId: true,
    createdAt: true,
    id: true,
    payment: {
      select: {
        amountPaid: true,
        amountRefunded: true,
        id: true,
        provider: true,
        status: true,
      },
    },
    paymentId: true,
    processedAt: true,
    providerRefundId: true,
    reasonHi: true,
    requestedAt: true,
    status: true,
    updatedAt: true,
  }) satisfies Prisma.RefundSelect;
