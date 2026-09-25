import "server-only";

import type { LoyaltyTxnType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Columns returned for every public loyalty transaction. */
const PUBLIC_TXN_SELECT = {
  id: true,
  points: true,
  type: true,
  description: true,
  referenceId: true,
  createdAt: true,
} as const satisfies Prisma.LoyaltyTransactionSelect;

/** Loads the caller's current balance. */
export async function getUserPoints(userId: string): Promise<number> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });
  return row?.loyaltyPoints ?? 0;
}

/**
 * Cursor-paginated ledger of the caller's loyalty transactions.
 *
 * Why:
 * Ordered by createdAt desc so the most recent activity appears first. The
 * secondary id sort keeps pagination stable when two rows share a timestamp.
 */
export async function listUserTransactions(
  userId: string,
  input: {
    cursor?: string;
    limit: number;
    type?: LoyaltyTxnType;
  },
) {
  const where: Prisma.LoyaltyTransactionWhereInput = {
    userId,
    ...(input.type ? { type: input.type } : {}),
  };

  const rows = await prisma.loyaltyTransaction.findMany({
    where,
    select: PUBLIC_TXN_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a single transaction scoped to the caller. */
export async function findUserTransaction(userId: string, txnId: string) {
  return prisma.loyaltyTransaction.findFirst({
    where: { id: txnId, userId },
    select: PUBLIC_TXN_SELECT,
  });
}

/**
 * Checks whether a transaction already exists for the given (userId, referenceId, type).
 *
 * Why:
 * Prevents double-awarding points for the same appointment if the COMPLETED
 * transition is retried or the completion handler crashes and restarts.
 */
export async function hasTransactionForReference(
  userId: string,
  referenceId: string,
  type: LoyaltyTxnType,
): Promise<boolean> {
  const row = await prisma.loyaltyTransaction.findFirst({
    where: { userId, referenceId, type },
    select: { id: true },
  });
  return row !== null;
}

/**
 * Awards points atomically: creates the ledger row and increments the
 * denormalized balance in one transaction.
 *
 * Why:
 * If the increment succeeds but the ledger insert fails, or vice versa, the
 * balance and ledger would drift apart. A transaction keeps both in step.
 * Callers must pass a positive `points` value.
 */
export async function awardPoints(input: {
  userId: string;
  points: number;
  type: LoyaltyTxnType;
  description: string | null;
  referenceId: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const txn = await tx.loyaltyTransaction.create({
      data: {
        userId: input.userId,
        points: input.points,
        type: input.type,
        description: input.description,
        referenceId: input.referenceId,
      },
      select: PUBLIC_TXN_SELECT,
    });

    await tx.user.update({
      where: { id: input.userId },
      data: { loyaltyPoints: { increment: input.points } },
    });

    return txn;
  });
}

/**
 * Redeems points atomically with a balance guard.
 *
 * Why:
 * A naive implementation reads the balance, checks it, then writes. Two
 * concurrent requests can both pass the check and overspend. We guard the
 * decrement with a conditional `updateMany` that includes the balance in its
 * WHERE clause — the database then becomes the arbiter of who wins.
 */
export async function redeemPoints(input: {
  userId: string;
  points: number;
  description: string | null;
  referenceId: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    // Guard the decrement against the current balance at write time.
    const updated = await tx.user.updateMany({
      where: {
        id: input.userId,
        loyaltyPoints: { gte: input.points },
      },
      data: { loyaltyPoints: { decrement: input.points } },
    });

    if (updated.count !== 1) {
      // Either the user does not exist or the balance is insufficient.
      // Distinguish by loading the current balance for a helpful error.
      const current = await tx.user.findUnique({
        where: { id: input.userId },
        select: { loyaltyPoints: true },
      });
      const available = current?.loyaltyPoints ?? 0;
      const err = new Error("INSUFFICIENT_POINTS") as Error & {
        available?: number;
      };
      err.available = available;
      throw err;
    }

    const txn = await tx.loyaltyTransaction.create({
      data: {
        userId: input.userId,
        points: -input.points,
        type: "REDEEMED",
        description: input.description,
        referenceId: input.referenceId,
      },
      select: PUBLIC_TXN_SELECT,
    });

    return txn;
  });
}
