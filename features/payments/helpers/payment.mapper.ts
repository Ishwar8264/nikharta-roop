type DecimalLike = {
  toString(): string;
};

type RefundRow = {
  amount: DecimalLike;
  createdAt: Date;
  id: string;
  processedAt: Date | null;
  providerRefundId: string | null;
  reasonHi: string | null;
  requestedAt: Date;
  status: string;
  updatedAt: Date;
};

type PaymentRow = {
  amount: DecimalLike;
  amountPaid: DecimalLike;
  amountRefunded: DecimalLike;
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
  refunds?: RefundRow[];
  status: string;
  updatedAt: Date;
};

/**
 * Converts a payment row into the public payment API shape.
 */
export function toPublicPayment(payment: PaymentRow) {
  return {
    amount: payment.amount.toString(),
    amountPaid: payment.amountPaid.toString(),
    amountRefunded: payment.amountRefunded.toString(),
    bookingId: payment.bookingId,
    createdAt: payment.createdAt,
    currency: payment.currency,
    id: payment.id,
    paidAt: payment.paidAt,
    paymentUrl: payment.paymentUrl,
    provider: payment.provider,
    providerOrderId: payment.providerOrderId,
    providerPaymentId: payment.providerPaymentId,
    refundedAt: payment.refundedAt,
    refunds: payment.refunds?.map(toPublicRefund) ?? [],
    status: payment.status,
    updatedAt: payment.updatedAt,
  };
}

/**
 * Converts a refund row into the public refund API shape.
 */
export function toPublicRefund(refund: RefundRow) {
  return {
    amount: refund.amount.toString(),
    createdAt: refund.createdAt,
    id: refund.id,
    processedAt: refund.processedAt,
    providerRefundId: refund.providerRefundId,
    reason: refund.reasonHi,
    requestedAt: refund.requestedAt,
    status: refund.status,
    updatedAt: refund.updatedAt,
  };
}
