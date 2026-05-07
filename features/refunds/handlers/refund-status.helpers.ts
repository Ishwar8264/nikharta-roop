import { PaymentStatus, RefundStatus, type Prisma } from "@prisma/client";

import { REFUND_CODES } from "@/features/refunds/constants/refund.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { RefundVisibleError } from "./refund.shared";

/**
 * Blocks changing a terminal refund status to another status.
 */
export function assertRefundTransition(current: RefundStatus, next?: RefundStatus) {
  if (!next || next === current) return;
  if (current === RefundStatus.SUCCEEDED || current === RefundStatus.FAILED) {
    throw new RefundVisibleError(
      REFUND_CODES.VALIDATION_ERROR,
      "Terminal refund status cannot be changed.",
      HTTP_STATUS.CONFLICT,
    );
  }
}

/**
 * Builds status-sensitive refund patch data.
 */
export function refundUpdateData(input: {
  processedAt?: Date | null;
  providerRefundId?: string | null;
  reasonHi?: string | null;
  status?: RefundStatus;
}) {
  return {
    processedAt:
      input.processedAt ?? (isTerminalStatus(input.status) ? new Date() : undefined),
    providerRefundId: input.providerRefundId,
    reasonHi: input.reasonHi,
    status: input.status,
  };
}

/**
 * Updates payment refund totals when a refund succeeds for the first time.
 */
export async function applySucceededRefund(input: {
  amount: Prisma.Decimal;
  paymentId: string;
  tx: Prisma.TransactionClient;
}) {
  const payment = await input.tx.payment.findUniqueOrThrow({
    select: { amountPaid: true, amountRefunded: true, id: true },
    where: { id: input.paymentId },
  });
  const nextRefunded = payment.amountRefunded.plus(input.amount);
  if (nextRefunded.greaterThan(payment.amountPaid)) {
    throw new RefundVisibleError(
      REFUND_CODES.VALIDATION_ERROR,
      "Refund amount exceeds paid payment amount.",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }
  await input.tx.payment.update({
    data: {
      amountRefunded: nextRefunded,
      refundedAt: new Date(),
      status: nextRefunded.greaterThanOrEqualTo(payment.amountPaid)
        ? PaymentStatus.REFUNDED
        : PaymentStatus.PARTIALLY_REFUNDED,
    },
    where: { id: input.paymentId },
  });
}

/**
 * Identifies statuses that should carry a processed timestamp.
 */
function isTerminalStatus(status?: RefundStatus) {
  return status === RefundStatus.SUCCEEDED || status === RefundStatus.FAILED;
}
