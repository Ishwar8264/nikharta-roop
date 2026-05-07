/**
 * Stable machine-readable codes returned by staff commission API responses.
 */
export const STAFF_COMMISSION_CODES = {
  COMMISSION_CREATED: "STAFF_COMMISSION_CREATED",
  COMMISSION_CREATE_FAILED: "STAFF_COMMISSION_CREATE_FAILED",
  COMMISSION_LISTED: "STAFF_COMMISSION_LISTED",
  COMMISSION_LOAD_FAILED: "STAFF_COMMISSION_LOAD_FAILED",
  COMMISSION_NOT_FOUND: "STAFF_COMMISSION_NOT_FOUND",
  COMMISSION_UPDATED: "STAFF_COMMISSION_UPDATED",
  COMMISSION_UPDATE_FAILED: "STAFF_COMMISSION_UPDATE_FAILED",
  FORBIDDEN: "STAFF_COMMISSION_FORBIDDEN",
  SOURCE_NOT_FOUND: "STAFF_COMMISSION_SOURCE_NOT_FOUND",
  STAFF_NOT_FOUND: "STAFF_COMMISSION_STAFF_NOT_FOUND",
  VALIDATION_ERROR: "STAFF_COMMISSION_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with staff commission response codes.
 */
export const STAFF_COMMISSION_MESSAGES = {
  COMMISSION_CREATED: "Staff commission created successfully.",
  COMMISSION_CREATE_FAILED: "Could not create staff commission.",
  COMMISSION_LISTED: "Staff commissions loaded successfully.",
  COMMISSION_LOAD_FAILED: "Could not load staff commissions.",
  COMMISSION_NOT_FOUND: "Staff commission was not found.",
  COMMISSION_UPDATED: "Staff commission updated successfully.",
  COMMISSION_UPDATE_FAILED: "Could not update staff commission.",
  FORBIDDEN: "You do not have permission to manage this staff commission.",
  SOURCE_NOT_FOUND: "Commission source was not found.",
  STAFF_NOT_FOUND: "Staff profile was not found.",
  VALIDATION_ERROR: "Please check the staff commission request and try again.",
} as const;
