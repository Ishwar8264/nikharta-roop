import type { Prisma } from "@prisma/client";

import {
  loyaltyTransactionSelect,
  loyaltyUserSelect,
} from "./loyalty.selectors";

export type LoyaltyTransactionRow = Prisma.LoyaltyTransactionGetPayload<{
  select: ReturnType<typeof loyaltyTransactionSelect>;
}>;

export type LoyaltyUserRow = Prisma.UserGetPayload<{
  select: ReturnType<typeof loyaltyUserSelect>;
}>;

/**
 * Converts a loyalty transaction into the API shape.
 */
export function toPublicLoyaltyTransaction(transaction: LoyaltyTransactionRow) {
  return transaction;
}

/**
 * Converts a user row into the loyalty summary shape.
 */
export function toPublicLoyaltySummary(user: LoyaltyUserRow) {
  return {
    points: user.loyaltyPoints,
    user,
  };
}
