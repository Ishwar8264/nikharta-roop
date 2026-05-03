import {
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@prisma/client";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { ZodError, ZodType } from "zod";

import { getDb } from "@/db";
import {
  getAuthenticatedSession,
  touchSession,
} from "@/features/auth/handlers/auth.handlers";
import {
  PAYMENT_CODES,
  PAYMENT_MESSAGES,
} from "@/features/payments/constants/payment.constants";
import { toPublicPayment } from "@/features/payments/helpers/payment.mapper";
import {
  paymentError,
  paymentJson,
} from "@/features/payments/responses/payment.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";
import {
  createPaymentSchema,
  type CreatePaymentInput,
  createRefundSchema,
  type CreateRefundInput,
  verifyPaymentSchema,
  type VerifyPaymentInput,
} from "@/schema/payments/schema.payment";

/**
 * Handles payment creation for a booking owned by the current user.
 */
export async function handleCreateBookingPayment(
  request: Request,
  bookingId: string,
) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parsePaymentBody(request, createPaymentSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createBookingPayment(
    auth.session.id,
    auth.session.userId,
    bookingId,
    parsedBody.data,
  );
}

/**
 * Handles payment listing for a booking owned by the current user.
 */
export async function handleListBookingPayments(
  request: Request,
  bookingId: string,
) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  return listBookingPayments(auth.session.id, auth.session.userId, bookingId);
}

/**
 * Handles payment verification for the current user.
 */
export async function handleVerifyPayment(request: Request, paymentId: string) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parsePaymentBody(request, verifyPaymentSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return verifyPayment(
    auth.session.id,
    auth.session.userId,
    paymentId,
    parsedBody.data,
  );
}

/**
 * Handles refund request creation for a paid payment owned by the current user.
 */
export async function handleCreateRefund(request: Request, paymentId: string) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parsePaymentBody(request, createRefundSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createRefund(
    auth.session.id,
    auth.session.userId,
    paymentId,
    parsedBody.data,
  );
}

/**
 * Creates or reuses an unpaid payment for a pending booking.
 */
async function createBookingPayment(
  sessionId: string,
  userId: string,
  bookingId: string,
  input: CreatePaymentInput,
) {
  try {
    const payment = await getDb().$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        select: {
          advanceAmount: true,
          id: true,
          status: true,
          totalAmount: true,
          userId: true,
        },
        where: {
          id: bookingId,
          userId,
        },
      });

      if (!booking) {
        throw new PaymentVisibleError(
          PAYMENT_CODES.BOOKING_NOT_FOUND,
          PAYMENT_MESSAGES.BOOKING_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new PaymentVisibleError(
          PAYMENT_CODES.INVALID_PAYMENT_STATE,
          PAYMENT_MESSAGES.INVALID_PAYMENT_STATE,
          HTTP_STATUS.CONFLICT,
        );
      }

      const reusablePayment = await tx.payment.findFirst({
        orderBy: {
          createdAt: "desc",
        },
        select: paymentSelect(),
        where: {
          bookingId,
          provider: input.provider,
          status: {
            in: [PaymentStatus.CREATED, PaymentStatus.PENDING],
          },
          userId,
        },
      });

      if (reusablePayment) {
        return reusablePayment;
      }

      const amount = booking.advanceAmount ?? booking.totalAmount;
      const payment = await tx.payment.create({
        data: {
          amount,
          bookingId,
          currency: "INR",
          provider: input.provider,
          providerOrderId: createProviderOrderId(input.provider),
          status: PaymentStatus.CREATED,
          userId,
        },
        select: paymentSelect(),
      });

      return payment;
    });

    await touchSession(sessionId);

    return paymentJson({
      code: PAYMENT_CODES.PAYMENT_CREATED,
      data: {
        payment: toPublicPayment(payment),
      },
      message: PAYMENT_MESSAGES.PAYMENT_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handlePaymentWriteError(error, {
      failureCode: PAYMENT_CODES.PAYMENT_CREATE_FAILED,
      failureMessage: PAYMENT_MESSAGES.PAYMENT_CREATE_FAILED,
      handler: "createBookingPayment",
      userId,
    });
  }
}

/**
 * Lists payments for a booking owned by the authenticated user.
 */
async function listBookingPayments(
  sessionId: string,
  userId: string,
  bookingId: string,
) {
  try {
    const booking = await getDb().booking.findFirst({
      select: {
        id: true,
      },
      where: {
        id: bookingId,
        userId,
      },
    });

    if (!booking) {
      return paymentError({
        code: PAYMENT_CODES.BOOKING_NOT_FOUND,
        message: PAYMENT_MESSAGES.BOOKING_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND,
      });
    }

    const payments = await getDb().payment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: paymentSelect(),
      where: {
        bookingId,
        userId,
      },
    });

    await touchSession(sessionId);

    return paymentJson({
      code: PAYMENT_CODES.PAYMENT_LIST_LOADED,
      data: {
        payments: payments.map(toPublicPayment),
      },
      message: PAYMENT_MESSAGES.PAYMENT_LIST_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(PAYMENT_CODES.PAYMENT_LIST_LOAD_FAILED, {
      bookingId,
      error,
      handler: "listBookingPayments",
      userId,
    });

    return paymentError({
      code: PAYMENT_CODES.PAYMENT_LIST_LOAD_FAILED,
      message: PAYMENT_MESSAGES.PAYMENT_LIST_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Marks a payment paid and confirms the booking after provider verification.
 */
async function verifyPayment(
  sessionId: string,
  userId: string,
  paymentId: string,
  input: VerifyPaymentInput,
) {
  try {
    const payment = await getDb().$transaction(
      async (tx) => {
        const currentPayment = await tx.payment.findFirst({
          select: {
            amount: true,
            booking: {
              select: {
                id: true,
                status: true,
              },
            },
            bookingId: true,
            id: true,
            provider: true,
            providerOrderId: true,
            status: true,
          },
          where: {
            id: paymentId,
            userId,
          },
        });

        if (!currentPayment) {
          throw new PaymentVisibleError(
            PAYMENT_CODES.PAYMENT_NOT_FOUND,
            PAYMENT_MESSAGES.PAYMENT_NOT_FOUND,
            HTTP_STATUS.NOT_FOUND,
          );
        }

        if (
          currentPayment.status !== PaymentStatus.CREATED &&
          currentPayment.status !== PaymentStatus.PENDING
        ) {
          throw new PaymentVisibleError(
            PAYMENT_CODES.INVALID_PAYMENT_STATE,
            PAYMENT_MESSAGES.INVALID_PAYMENT_STATE,
            HTTP_STATUS.CONFLICT,
          );
        }

        if (currentPayment.booking.status !== BookingStatus.PENDING) {
          throw new PaymentVisibleError(
            PAYMENT_CODES.INVALID_PAYMENT_STATE,
            PAYMENT_MESSAGES.INVALID_PAYMENT_STATE,
            HTTP_STATUS.CONFLICT,
          );
        }

        if (input.providerOrderId !== currentPayment.providerOrderId) {
          throw new PaymentVisibleError(
            PAYMENT_CODES.VALIDATION_ERROR,
            "Provider order id does not match this payment.",
            HTTP_STATUS.UNPROCESSABLE_ENTITY,
          );
        }

        assertProviderVerification(currentPayment.provider, input);

        const paidAt = new Date();
        const updatedPayment = await tx.payment.update({
          data: {
            amountPaid: currentPayment.amount,
            paidAt,
            providerPaymentId: input.providerPaymentId,
            status: PaymentStatus.PAID,
          },
          select: paymentSelect(),
          where: {
            id: currentPayment.id,
          },
        });

        await tx.booking.update({
          data: {
            pendingExpiresAt: null,
            status: BookingStatus.CONFIRMED,
            statusHistory: {
              create: {
                fromStatus: BookingStatus.PENDING,
                reason: "Payment verified.",
                toStatus: BookingStatus.CONFIRMED,
              },
            },
          },
          where: {
            id: currentPayment.bookingId,
          },
        });

        return updatedPayment;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    await touchSession(sessionId);

    return paymentJson({
      code: PAYMENT_CODES.PAYMENT_VERIFIED,
      data: {
        payment: toPublicPayment(payment),
      },
      message: PAYMENT_MESSAGES.PAYMENT_VERIFIED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handlePaymentWriteError(error, {
      failureCode: PAYMENT_CODES.PAYMENT_VERIFY_FAILED,
      failureMessage: PAYMENT_MESSAGES.PAYMENT_VERIFY_FAILED,
      handler: "verifyPayment",
      userId,
    });
  }
}

/**
 * Creates a refund request without pretending the provider has processed it.
 */
async function createRefund(
  sessionId: string,
  userId: string,
  paymentId: string,
  input: CreateRefundInput,
) {
  try {
    const payment = await getDb().$transaction(async (tx) => {
      const currentPayment = await tx.payment.findFirst({
        select: {
          amountPaid: true,
          amountRefunded: true,
          booking: {
            select: {
              status: true,
            },
          },
          bookingId: true,
          id: true,
          status: true,
        },
        where: {
          id: paymentId,
          userId,
        },
      });

      if (!currentPayment) {
        throw new PaymentVisibleError(
          PAYMENT_CODES.PAYMENT_NOT_FOUND,
          PAYMENT_MESSAGES.PAYMENT_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      if (
        currentPayment.status !== PaymentStatus.PAID &&
        currentPayment.status !== PaymentStatus.PARTIALLY_REFUNDED
      ) {
        throw new PaymentVisibleError(
          PAYMENT_CODES.INVALID_PAYMENT_STATE,
          PAYMENT_MESSAGES.INVALID_PAYMENT_STATE,
          HTTP_STATUS.CONFLICT,
        );
      }

      if (currentPayment.booking.status !== BookingStatus.CANCELLED) {
        throw new PaymentVisibleError(
          PAYMENT_CODES.INVALID_PAYMENT_STATE,
          "Refund can be requested only after booking cancellation.",
          HTTP_STATUS.CONFLICT,
        );
      }

      const refundableAmount = currentPayment.amountPaid.minus(
        currentPayment.amountRefunded,
      );
      const requestedAmount = input.amount
        ? new Prisma.Decimal(input.amount)
        : refundableAmount;

      if (
        requestedAmount.lessThanOrEqualTo(0) ||
        requestedAmount.greaterThan(refundableAmount)
      ) {
        throw new PaymentVisibleError(
          PAYMENT_CODES.VALIDATION_ERROR,
          "Refund amount exceeds refundable payment amount.",
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
        );
      }

      await tx.refund.create({
        data: {
          amount: requestedAmount,
          bookingId: currentPayment.bookingId,
          paymentId: currentPayment.id,
          reasonHi: input.reason ?? null,
        },
      });

      return tx.payment.findUniqueOrThrow({
        select: paymentSelect(),
        where: {
          id: currentPayment.id,
        },
      });
    });

    await touchSession(sessionId);

    return paymentJson({
      code: PAYMENT_CODES.REFUND_CREATED,
      data: {
        payment: toPublicPayment(payment),
      },
      message: PAYMENT_MESSAGES.REFUND_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handlePaymentWriteError(error, {
      failureCode: PAYMENT_CODES.REFUND_CREATE_FAILED,
      failureMessage: PAYMENT_MESSAGES.REFUND_CREATE_FAILED,
      handler: "createRefund",
      userId,
    });
  }
}

/**
 * Parses JSON bodies with payment-owned validation error codes.
 */
async function parsePaymentBody<T>(request: Request, schema: ZodType<T>) {
  const body = await readJsonBody(request);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      data: null,
      error: paymentError({
        code: PAYMENT_CODES.VALIDATION_ERROR,
        message: getPaymentValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return {
    data: parsed.data,
    error: null,
  };
}

/**
 * Reads JSON safely so malformed bodies become validation responses.
 */
async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Keeps validation responses focused on the first actionable payment field.
 */
function getPaymentValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? PAYMENT_MESSAGES.VALIDATION_ERROR;
}

/**
 * Selects fields needed by the public payment response.
 */
function paymentSelect() {
  return {
    amount: true,
    amountPaid: true,
    amountRefunded: true,
    bookingId: true,
    createdAt: true,
    currency: true,
    id: true,
    paidAt: true,
    paymentUrl: true,
    provider: true,
    providerOrderId: true,
    providerPaymentId: true,
    refundedAt: true,
    refunds: {
      orderBy: {
        requestedAt: "desc",
      },
      select: {
        amount: true,
        createdAt: true,
        id: true,
        processedAt: true,
        providerRefundId: true,
        reasonHi: true,
        requestedAt: true,
        status: true,
        updatedAt: true,
      },
    },
    status: true,
    updatedAt: true,
  } satisfies Prisma.PaymentSelect;
}

/**
 * Creates a provider order reference until a live gateway adapter owns it.
 */
function createProviderOrderId(provider: PaymentProvider) {
  const suffix = Math.random().toString(36).slice(2, 12);

  return `${provider.toLowerCase()}_${Date.now()}_${suffix}`;
}

/**
 * Verifies provider payloads before marking a payment as paid.
 */
function assertProviderVerification(
  provider: PaymentProvider,
  input: VerifyPaymentInput,
) {
  if (provider !== PaymentProvider.RAZORPAY) {
    return;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret || !input.signature) {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    throw new PaymentVisibleError(
      PAYMENT_CODES.VALIDATION_ERROR,
      "Payment signature is required for Razorpay verification.",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }

  const payload = `${input.providerOrderId}|${input.providerPaymentId}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (!safeEqual(expectedSignature, input.signature)) {
    throw new PaymentVisibleError(
      PAYMENT_CODES.VALIDATION_ERROR,
      "Payment signature is invalid.",
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Compares verification strings without leaking timing differences.
 */
function safeEqual(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

/**
 * Converts expected payment failures into user-safe API responses.
 */
function handlePaymentWriteError(
  error: unknown,
  input: {
    failureCode: string;
    failureMessage: string;
    handler: string;
    userId: string;
  },
) {
  if (error instanceof PaymentVisibleError) {
    return paymentError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }

  console.error(input.failureCode, {
    error,
    handler: input.handler,
    userId: input.userId,
  });

  return paymentError({
    code: input.failureCode,
    message: input.failureMessage,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Carries expected payment errors across transaction boundaries.
 */
class PaymentVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
