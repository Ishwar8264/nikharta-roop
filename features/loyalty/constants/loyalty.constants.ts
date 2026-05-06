/**
 * Stable machine-readable codes returned by loyalty API responses.
 */
export const LOYALTY_CODES = {
  FORBIDDEN: "LOYALTY_FORBIDDEN",
  INSUFFICIENT_POINTS: "LOYALTY_INSUFFICIENT_POINTS",
  LOYALTY_SUMMARY_LOADED: "LOYALTY_SUMMARY_LOADED",
  LOYALTY_SUMMARY_LOAD_FAILED: "LOYALTY_SUMMARY_LOAD_FAILED",
  TRANSACTION_CREATED: "LOYALTY_TRANSACTION_CREATED",
  TRANSACTION_CREATE_FAILED: "LOYALTY_TRANSACTION_CREATE_FAILED",
  TRANSACTIONS_LISTED: "LOYALTY_TRANSACTIONS_LISTED",
  TRANSACTIONS_LOAD_FAILED: "LOYALTY_TRANSACTIONS_LOAD_FAILED",
  USER_NOT_FOUND: "LOYALTY_USER_NOT_FOUND",
  VALIDATION_ERROR: "LOYALTY_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with loyalty response codes.
 */
export const LOYALTY_MESSAGES = {
  FORBIDDEN: "You do not have permission to manage loyalty points.",
  INSUFFICIENT_POINTS: "Customer does not have enough loyalty points.",
  LOYALTY_SUMMARY_LOADED: "Loyalty summary loaded successfully.",
  LOYALTY_SUMMARY_LOAD_FAILED: "Could not load loyalty summary.",
  TRANSACTION_CREATED: "Loyalty transaction created successfully.",
  TRANSACTION_CREATE_FAILED: "Could not create loyalty transaction.",
  TRANSACTIONS_LISTED: "Loyalty transactions loaded successfully.",
  TRANSACTIONS_LOAD_FAILED: "Could not load loyalty transactions.",
  USER_NOT_FOUND: "Customer was not found.",
  VALIDATION_ERROR: "Please check the loyalty request and try again.",
} as const;
