export type LoyaltyTransactionRow = {
  booking: Record<string, unknown> | null;
  bookingId: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  id: string;
  points: number;
  reasonHi: string | null;
  type: string;
  user: Record<string, unknown>;
  userId: string;
};

export type LoyaltyUserRow = {
  branchId: string | null;
  id: string;
  loyaltyPoints: number;
  mobile: string;
  name: string | null;
};

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
