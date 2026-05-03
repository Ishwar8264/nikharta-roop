import assert from "node:assert/strict";
import test from "node:test";

import {
  createPaymentSchema,
  createRefundSchema,
  verifyPaymentSchema,
} from "../../../schema/payments/schema.payment.ts";

test("createPaymentSchema defaults empty bodies to Razorpay", () => {
  assert.deepEqual(createPaymentSchema.parse(null), {
    provider: "RAZORPAY",
  });
});

test("createPaymentSchema rejects offline customer payment providers", () => {
  assert.equal(
    createPaymentSchema.safeParse({
      provider: "CASH",
    }).success,
    false,
  );
});

test("verifyPaymentSchema parses provider references", () => {
  assert.deepEqual(
    verifyPaymentSchema.parse({
      providerOrderId: "order_12345",
      providerPaymentId: "pay_12345",
      signature: "abcdef1234567890",
    }),
    {
      providerOrderId: "order_12345",
      providerPaymentId: "pay_12345",
      signature: "abcdef1234567890",
    },
  );
});

test("createRefundSchema accepts empty refund requests", () => {
  assert.deepEqual(createRefundSchema.parse(undefined), {});
});
