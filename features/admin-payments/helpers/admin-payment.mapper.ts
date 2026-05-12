import type { Prisma } from "@prisma/client";

import { adminPaymentSelect } from "./admin-payment.selectors";

export type AdminPaymentRow = Prisma.PaymentGetPayload<{
  select: ReturnType<typeof adminPaymentSelect>;
}>;

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
