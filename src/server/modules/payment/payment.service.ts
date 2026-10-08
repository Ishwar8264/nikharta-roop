import "server-only";

import { Prisma } from "@/generated/prisma/client";

import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
} from "@/server/modules/appointment/appointment.errors";
import {
  assertCanRecordPayment,
  assertCanViewAppointment,
  buildAppointmentViewerContext,
} from "@/server/modules/appointment/appointment.authorization";
import { findAppointmentById } from "@/server/modules/appointment/appointment.repository";

import {
  PaymentIdempotencyConflictError,
  PaymentRefundExceedsCollectedError,
} from "./payment.errors";
import {
  createTransaction,
  listTransactionsByAppointment,
  sumCollectedForAppointment,
} from "./payment.repository";
import type {
  CreatePaymentTransactionInput,
  ListTransactionsQuery,
  PaginatedPaymentTransactions,
  PublicPaymentTransaction,
} from "./payment.types";

/** Normalizes Prisma Decimal amounts to plain numbers at the API boundary. */
function toPublicTransaction(row: {
  id: string;
  appointmentId: string;
  type: "ADVANCE" | "FINAL" | "REFUND";
  amount: { toNumber(): number } | number;
  commission: { toNumber(): number } | number;
  method: string;
  gatewayRef: string | null;
  createdAt: Date;
}): PublicPaymentTransaction {
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    type: row.type,
    amount: Number(row.amount),
    commission: Number(row.commission),
    method: row.method as PublicPaymentTransaction["method"],
    gatewayRef: row.gatewayRef,
    createdAt: row.createdAt,
  };
}

/** Loads an appointment and asserts the caller may view it. */
async function loadViewableAppointment(callerId: string, appointmentId: string) {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppointmentNotFoundError();

  const context = await buildAppointmentViewerContext({
    userId: callerId,
    customerId: appointment.customerId,
    salonId: appointment.salonId,
    assignedStaffUserId: appointment.staffId,
  });
  assertCanViewAppointment(context);

  return appointment;
}

/** Lists the transactions for an appointment the caller can view. */
export async function listAppointmentTransactions(
  callerId: string,
  appointmentId: string,
  query: ListTransactionsQuery,
): Promise<PaginatedPaymentTransactions> {
  await loadViewableAppointment(callerId, appointmentId);
  const result = await listTransactionsByAppointment(appointmentId, {
    cursor: query.cursor,
    limit: query.limit,
  });

  return {
    items: result.items.map(toPublicTransaction),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Records an advance/final/refund transaction for an appointment.
 *
 * Why:
 * A refund must never exceed what was collected — otherwise the ledger would
 * allow negative balances. The idempotency key is the retry boundary: a
 * repeated request with the same key hits the unique constraint and becomes
 * a 409 instead of a second row.
 */
export async function recordAppointmentTransaction(
  callerId: string,
  appointmentId: string,
  input: CreatePaymentTransactionInput,
): Promise<PublicPaymentTransaction> {
  const appointment = await findAppointmentById(appointmentId);
  if (!appointment) throw new AppointmentNotFoundError();

  const context = await buildAppointmentViewerContext({
    userId: callerId,
    customerId: appointment.customerId,
    salonId: appointment.salonId,
    assignedStaffUserId: appointment.staffId,
  });
  assertCanRecordPayment(context);

  if (input.type === "REFUND") {
    const collected = await sumCollectedForAppointment(appointmentId);
    if (input.amount > collected) {
      throw new PaymentRefundExceedsCollectedError();
    }
  }

  try {
    return toPublicTransaction(
      await createTransaction({
        appointmentId,
        type: input.type,
        amount: input.amount,
        commission: input.commission,
        method: input.method,
        gatewayRef: input.gatewayRef ?? null,
        idempotencyKey: input.idempotencyKey,
      }),
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new PaymentIdempotencyConflictError();
    }
    if (error instanceof AppointmentAccessDeniedError) {
      throw error;
    }
    throw error;
  }
}
