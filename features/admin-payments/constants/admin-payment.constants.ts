/**
 * Stable machine-readable codes returned by admin payment API responses.
 */
export const ADMIN_PAYMENT_CODES = {
  FORBIDDEN: "ADMIN_PAYMENT_FORBIDDEN",
  PAYMENT_LISTED: "ADMIN_PAYMENT_LISTED",
  PAYMENT_LOAD_FAILED: "ADMIN_PAYMENT_LOAD_FAILED",
  PAYMENT_LOADED: "ADMIN_PAYMENT_LOADED",
  PAYMENT_NOT_FOUND: "ADMIN_PAYMENT_NOT_FOUND",
  VALIDATION_ERROR: "ADMIN_PAYMENT_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with admin payment response codes.
 */
export const ADMIN_PAYMENT_MESSAGES = {
  FORBIDDEN: "You do not have permission to view these payments.",
  PAYMENT_LISTED: "Payments loaded successfully.",
  PAYMENT_LOAD_FAILED: "Could not load payments.",
  PAYMENT_LOADED: "Payment loaded successfully.",
  PAYMENT_NOT_FOUND: "Payment was not found.",
  VALIDATION_ERROR: "Please check the payment request and try again.",
} as const;
