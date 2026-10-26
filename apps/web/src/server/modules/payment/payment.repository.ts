import "server-only";

import { prisma } from "@/lib/prisma";

const PUBLIC_TRANSACTION_SELECT = {
  id: true,
  appointmentId: true,
  type: true,
  amount: true,
  commission: true,
  method: true,
  gatewayRef: true,
  createdAt: true,
} as const;

/** Cursor-paginated transactions for one appointment (newest first). */
export async function listTransactionsByAppointment(
  appointmentId: string,
  input: { cursor?: string; limit: number },
) {
  const rows = await prisma.paymentTransaction.findMany({
    where: { appointmentId },
    select: PUBLIC_TRANSACTION_SELECT,
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

/** Sums ADVANCE + FINAL amounts collected so far (REFUND excluded). */
export async function sumCollectedForAppointment(
  appointmentId: string,
): Promise<number> {
  const rows = await prisma.paymentTransaction.findMany({
    where: { appointmentId, type: { in: ["ADVANCE", "FINAL"] } },
    select: { amount: true },
  });
  return rows.reduce((sum, row) => sum + Number(row.amount), 0);
}

/** Persists a transaction; the unique idempotency key races are resolved by the DB. */
export async function createTransaction(data: {
  appointmentId: string;
  type: "ADVANCE" | "FINAL" | "REFUND";
  amount: number;
  commission: number;
  method: string;
  gatewayRef: string | null;
  idempotencyKey: string;
}) {
  return prisma.paymentTransaction.create({
    data: {
      appointmentId: data.appointmentId,
      type: data.type,
      amount: data.amount,
      commission: data.commission,
      method: data.method as never,
      gatewayRef: data.gatewayRef,
      idempotencyKey: data.idempotencyKey,
    },
    select: PUBLIC_TRANSACTION_SELECT,
  });
}
