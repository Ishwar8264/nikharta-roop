import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
} from "@/server/modules/appointment/appointment.errors";
import { appointmentParamSchema } from "@/server/modules/appointment/appointment.schema";
import {
  PaymentIdempotencyConflictError,
  PaymentRefundExceedsCollectedError,
} from "@/server/modules/payment/payment.errors";
import {
  createPaymentTransactionSchema,
  listTransactionsQuerySchema,
} from "@/server/modules/payment/payment.schema";
import {
  listAppointmentTransactions,
  recordAppointmentTransaction,
} from "@/server/modules/payment/payment.service";

/** Lists an appointment's payment transactions. */
export async function GET(
  request: Request,
  context: { params: Promise<{ appointmentId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = appointmentParamSchema.safeParse(params);

  if (!paramValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: paramValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const queryValidation = listTransactionsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!queryValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: queryValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await listAppointmentTransactions(
      auth.sub,
      paramValidation.data.appointmentId,
      queryValidation.data,
    );

    return NextResponse.json(
      {
        message: "Transactions retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof AppointmentAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Transaction listing failed", error);
    return NextResponse.json(
      { message: "Unable to list transactions" },
      { status: 500 },
    );
  }
}

/**
 * Records an advance/final/refund transaction.
 *
 * Why:
 * The idempotency key is echoed in the conflict response so clients can
 * retry safely — the 409 means "already recorded", not "failed".
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ appointmentId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = appointmentParamSchema.safeParse(params);

  if (!paramValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: paramValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const bodyValidation = createPaymentTransactionSchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: bodyValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const transaction = await recordAppointmentTransaction(
      auth.sub,
      paramValidation.data.appointmentId,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Transaction recorded", data: { transaction } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof AppointmentAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof PaymentIdempotencyConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof PaymentRefundExceedsCollectedError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Transaction recording failed", error);
    return NextResponse.json(
      { message: "Unable to record transaction" },
      { status: 500 },
    );
  }
}
