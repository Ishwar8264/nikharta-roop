type DecimalLike = { toString(): string };

export type AdminPaymentRow = {
  amount: DecimalLike;
  amountPaid: DecimalLike;
  amountRefunded: DecimalLike;
  booking: Record<string, unknown>;
  bookingId: string;
  createdAt: Date;
  currency: string;
  id: string;
  paidAt: Date | null;
  paymentUrl: string | null;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  refundedAt: Date | null;
  status: string;
  updatedAt: Date;
  user: Record<string, unknown>;
  userId: string;
};

/**
 * Converts decimal payment fields into API-safe string values.
 */
export function toPublicAdminPayment(payment: AdminPaymentRow) {
  return {
    ...payment,
    amount: payment.amount.toString(),
    amountPaid: payment.amountPaid.toString(),
    amountRefunded: payment.amountRefunded.toString(),
  };
}
