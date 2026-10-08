import "server-only";

/** Thrown when a transaction with the same idempotency key already exists. */
export class PaymentIdempotencyConflictError extends Error {
  constructor() {
    super(
      "A transaction with this idempotency key already exists",
    );
    this.name = "PaymentIdempotencyConflictError";
  }
}

/** Thrown when a REFUND exceeds the amount already collected. */
export class PaymentRefundExceedsCollectedError extends Error {
  constructor() {
    super("Refund cannot exceed the amount collected for this appointment");
    this.name = "PaymentRefundExceedsCollectedError";
  }
}
