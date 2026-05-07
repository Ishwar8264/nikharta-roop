/**
 * Stable machine-readable codes returned by refund admin API responses.
 */
export const REFUND_CODES = {
  FORBIDDEN: "REFUND_FORBIDDEN",
  REFUND_LISTED: "REFUND_LISTED",
  REFUND_LOAD_FAILED: "REFUND_LOAD_FAILED",
  REFUND_LOADED: "REFUND_LOADED",
  REFUND_NOT_FOUND: "REFUND_NOT_FOUND",
  REFUND_UPDATED: "REFUND_UPDATED",
  REFUND_UPDATE_FAILED: "REFUND_UPDATE_FAILED",
  VALIDATION_ERROR: "REFUND_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with refund response codes.
 */
export const REFUND_MESSAGES = {
  FORBIDDEN: "You do not have permission to manage this refund.",
  REFUND_LISTED: "Refunds loaded successfully.",
  REFUND_LOAD_FAILED: "Could not load refunds.",
  REFUND_LOADED: "Refund loaded successfully.",
  REFUND_NOT_FOUND: "Refund was not found.",
  REFUND_UPDATED: "Refund updated successfully.",
  REFUND_UPDATE_FAILED: "Could not update refund.",
  VALIDATION_ERROR: "Please check the refund request and try again.",
} as const;
