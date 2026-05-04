export const PAYMENT_CODES = {
  BOOKING_NOT_FOUND: "PAYMENT_BOOKING_NOT_FOUND",
  INVALID_PAYMENT_STATE: "PAYMENT_INVALID_STATE",
  PAYMENT_CREATE_FAILED: "PAYMENT_CREATE_FAILED",
  PAYMENT_CREATED: "PAYMENT_CREATED",
  PAYMENT_LIST_LOAD_FAILED: "PAYMENT_LIST_LOAD_FAILED",
  PAYMENT_LIST_LOADED: "PAYMENT_LIST_LOADED",
  PAYMENT_NOT_FOUND: "PAYMENT_NOT_FOUND",
  PAYMENT_VERIFY_FAILED: "PAYMENT_VERIFY_FAILED",
  PAYMENT_VERIFIED: "PAYMENT_VERIFIED",
  REFUND_CREATE_FAILED: "REFUND_CREATE_FAILED",
  REFUND_CREATED: "REFUND_CREATED",
  VALIDATION_ERROR: "PAYMENT_VALIDATION_ERROR",
} as const;

export const PAYMENT_MESSAGES = {
  BOOKING_NOT_FOUND: "Booking was not found for payment.",
  INVALID_PAYMENT_STATE: "Payment cannot be changed in its current state.",
  PAYMENT_CREATE_FAILED: "Could not create payment. Please try again later.",
  PAYMENT_CREATED: "Payment created successfully.",
  PAYMENT_LIST_LOAD_FAILED: "Could not load payments. Please try again later.",
  PAYMENT_LIST_LOADED: "Payments loaded successfully.",
  PAYMENT_NOT_FOUND: "Payment was not found.",
  PAYMENT_VERIFY_FAILED: "Could not verify payment. Please try again later.",
  PAYMENT_VERIFIED: "Payment verified successfully.",
  REFUND_CREATE_FAILED: "Could not request refund. Please try again later.",
  REFUND_CREATED: "Refund requested successfully.",
  VALIDATION_ERROR: "Please check the payment request and try again.",
} as const;
