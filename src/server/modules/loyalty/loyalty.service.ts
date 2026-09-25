import "server-only";

import {
  LoyaltyInsufficientPointsError,
  LoyaltyInvalidAmountError,
  LoyaltyTransactionNotFoundError,
} from "./loyalty.errors";
import {
  awardPoints,
  findUserTransaction,
  getUserPoints,
  hasTransactionForReference,
  listUserTransactions,
  redeemPoints,
} from "./loyalty.repository";
import type {
  ListTransactionsQuery,
  LoyaltyBalance,
  PaginatedTransactions,
  PublicLoyaltyTransaction,
  RedeemPointsInput,
  RedeemResult,
} from "./loyalty.types";

/** Points earned per ₹1 spent. Kept as a constant so both the earn and the
 *  display code read from the same number. */
const EARN_RATE_PER_RUPEE = 0.01;

/** Rupee discount per redeemed point. */
const REDEEM_RATE_PER_POINT = 1;

/** Returns the caller's loyalty balance and the applied rates. */
export async function getBalance(userId: string): Promise<LoyaltyBalance> {
  const points = await getUserPoints(userId);
  return {
    points,
    pointsValueRupees: points * REDEEM_RATE_PER_POINT,
    earnRatePerRupee: EARN_RATE_PER_RUPEE,
    redeemRatePerPoint: REDEEM_RATE_PER_POINT,
  };
}

/** Lists the caller's loyalty ledger. */
export async function listTransactions(
  userId: string,
  query: ListTransactionsQuery,
): Promise<PaginatedTransactions> {
  const result = await listUserTransactions(userId, query);
  return {
    items: result.items,
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/** Loads a single transaction owned by the caller. */
export async function getTransaction(
  userId: string,
  txnId: string,
): Promise<PublicLoyaltyTransaction> {
  const txn = await findUserTransaction(userId, txnId);
  if (!txn) throw new LoyaltyTransactionNotFoundError();
  return txn;
}

/**
 * Redeems points and returns the rupee discount.
 *
 * Why:
 * The balance check happens inside the repository transaction so a stale
 * read cannot overspend. This layer only converts the points request into
 * rupees and surfaces the typed error for the route.
 */
export async function redeemPointsForDiscount(
  userId: string,
  input: RedeemPointsInput,
): Promise<RedeemResult> {
  if (input.points <= 0) throw new LoyaltyInvalidAmountError();

  const discountRupees = input.points * REDEEM_RATE_PER_POINT;

  try {
    const txn = await redeemPoints({
      userId,
      points: input.points,
      description: input.description ?? "Points redeemed",
      referenceId: input.appointmentId ?? null,
    });

    const remaining = await getUserPoints(userId);
    return {
      transaction: txn,
      pointsRedeemed: input.points,
      discountRupees,
      remainingPoints: remaining,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      (error as { message?: string }).message === "INSUFFICIENT_POINTS"
    ) {
      const available = (error as { available?: number }).available ?? 0;
      throw new LoyaltyInsufficientPointsError(available, input.points);
    }
    throw error;
  }
}

/**
 * Awards points for a completed appointment.
 *
 * Why:
 * Called by the appointment status transition when a booking is marked
 * COMPLETED. Idempotent — a repeated completion (retry, crash recovery)
 * will not double-credit the customer.
 *
 * Returns null when the appointment already produced a ledger entry or
 * when the earned amount rounds to zero.
 */
export async function awardPointsForCompletedAppointment(input: {
  userId: string;
  totalPrice: number;
  appointmentId: string;
}): Promise<PublicLoyaltyTransaction | null> {
  const points = Math.floor(input.totalPrice * EARN_RATE_PER_RUPEE);
  if (points <= 0) return null;

  const already = await hasTransactionForReference(
    input.userId,
    input.appointmentId,
    "EARNED",
  );
  if (already) return null;

  return awardPoints({
    userId: input.userId,
    points,
    type: "EARNED",
    description: `Earned for appointment ${input.appointmentId}`,
    referenceId: input.appointmentId,
  });
}
