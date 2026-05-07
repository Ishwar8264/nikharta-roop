type DecimalLike = { toString(): string };

export type RefundRow = {
  amount: DecimalLike;
  booking: Record<string, unknown>;
  bookingId: string;
  createdAt: Date;
  id: string;
  payment: Record<string, unknown>;
  paymentId: string;
  processedAt: Date | null;
  providerRefundId: string | null;
  reasonHi: string | null;
  requestedAt: Date;
  status: string;
  updatedAt: Date;
};

/**
 * Converts a refund row into the admin API shape.
 */
export function toPublicRefund(refund: RefundRow) {
  return {
    ...refund,
    amount: refund.amount.toString(),
    reason: refund.reasonHi,
  };
}
