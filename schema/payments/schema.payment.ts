import { PaymentProvider } from "@prisma/client";
import { z } from "zod";

/**
 * Request schema for POST /api/v1/bookings/:bookingId/payments.
 */
export const createPaymentSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    provider: z
      .literal(PaymentProvider.RAZORPAY)
      .optional()
      .default(PaymentProvider.RAZORPAY),
  }),
);

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

/**
 * Request schema for POST /api/v1/payments/:paymentId/verify.
 */
export const verifyPaymentSchema = z.object({
  providerOrderId: z.string().trim().min(3).max(120),
  providerPaymentId: z.string().trim().min(3).max(120),
  signature: z.string().trim().min(10).max(256).optional(),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

/**
 * Request schema for POST /api/v1/payments/:paymentId/refunds.
 */
export const createRefundSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    amount: z.coerce.number().positive().optional(),
    reason: z.string().trim().max(300).nullable().optional(),
  }),
);

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
