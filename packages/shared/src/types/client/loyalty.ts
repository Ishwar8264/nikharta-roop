/**
 * Browser-safe types for the loyalty feature.
 *
 * Mirrors `src/server/modules/loyalty/loyalty.types.ts` with `Date` fields
 * serialized to ISO strings (the wire shape).
 */

export interface LoyaltyBalance {
  points: number;
  pointsValueRupees: number;
  earnRatePerRupee: number;
  redeemRatePerPoint: number;
}

export type LoyaltyTxnType = "EARNED" | "REDEEMED" | "EXPIRED" | "REFUNDED";

export interface PublicLoyaltyTransaction {
  id: string;
  points: number;
  type: LoyaltyTxnType;
  description: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface PaginatedTransactions {
  items: PublicLoyaltyTransaction[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface RedeemResult {
  transaction: PublicLoyaltyTransaction;
  pointsRedeemed: number;
  discountRupees: number;
  remainingPoints: number;
}

/** Props for the redeem dialog client component. */
export interface RedeemDialogProps {
  balance: LoyaltyBalance;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRedeemed: () => void;
}
