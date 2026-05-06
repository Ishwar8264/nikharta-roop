import type { ZodType } from "zod";

import { LOYALTY_CODES, LOYALTY_MESSAGES } from "@/features/loyalty/constants/loyalty.constants";
import type { LoyaltyTransactionRow } from "@/features/loyalty/helpers/loyalty.mapper";
import { toPublicLoyaltyTransaction } from "@/features/loyalty/helpers/loyalty.mapper";
import { loyaltyError, loyaltyJson } from "@/features/loyalty/responses/loyalty.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses loyalty query strings with feature-owned validation errors.
 */
export function parseLoyaltyQuery<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (parsed.success) return { data: parsed.data, success: true as const };
  return {
    error: loyaltyError({
      code: LOYALTY_CODES.VALIDATION_ERROR,
      message: LOYALTY_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a loyalty transaction collection in the shared response shape.
 */
export function loyaltyTransactionListResponse(
  transactions: LoyaltyTransactionRow[],
  limit: number,
) {
  return loyaltyJson({
    code: LOYALTY_CODES.TRANSACTIONS_LISTED,
    data: { limit, transactions: transactions.map(toPublicLoyaltyTransaction) },
    message: LOYALTY_MESSAGES.TRANSACTIONS_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
