import type { z } from "zod";

import type { LoyaltyTxnType } from "@/generated/prisma/client";

import type {
  listTransactionsQuerySchema,
  redeemPointsSchema,
} from "./loyalty.schema";

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;

/** Current loyalty summary for the caller. */
export interface LoyaltyBalance {
  points: number;
  pointsValueRupees: number;
  earnRatePerRupee: number;
  redeemRatePerPoint: number;
}

/** Public shape of a loyalty transaction. */
export interface PublicLoyaltyTransaction {
  id: string;
  points: number;
  type: LoyaltyTxnType;
  description: string | null;
  referenceId: string | null;
  createdAt: Date;
}

/** Cursor-paginated transactions. */
export interface PaginatedTransactions {
  items: PublicLoyaltyTransaction[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Result of a redemption. */
export interface RedeemResult {
  transaction: PublicLoyaltyTransaction;
  pointsRedeemed: number;
  discountRupees: number;
  remainingPoints: number;
}
