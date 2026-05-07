import type { Prisma } from "@prisma/client";

/**
 * Selects payment fields exposed by admin payment APIs.
 */
export const adminPaymentSelect = () =>
  ({
    amount: true,
    amountPaid: true,
    amountRefunded: true,
    booking: { select: { branchId: true, displayId: true, id: true, status: true } },
    bookingId: true,
    createdAt: true,
    currency: true,
    id: true,
    paidAt: true,
    paymentUrl: true,
    provider: true,
    providerOrderId: true,
    providerPaymentId: true,
    refundedAt: true,
    status: true,
    updatedAt: true,
    user: { select: { id: true, mobile: true, name: true } },
    userId: true,
  }) satisfies Prisma.PaymentSelect;
