/**
 * Stable machine-readable codes returned by report API responses.
 */
export const REPORT_CODES = {
  BOOKING_REPORT_LOADED: "BOOKING_REPORT_LOADED",
  BOOKING_REPORT_LOAD_FAILED: "BOOKING_REPORT_LOAD_FAILED",
  EXPENSE_REPORT_LOADED: "EXPENSE_REPORT_LOADED",
  EXPENSE_REPORT_LOAD_FAILED: "EXPENSE_REPORT_LOAD_FAILED",
  FORBIDDEN: "REPORT_FORBIDDEN",
  PRODUCT_REPORT_LOADED: "PRODUCT_REPORT_LOADED",
  PRODUCT_REPORT_LOAD_FAILED: "PRODUCT_REPORT_LOAD_FAILED",
  REPORT_BRANCH_NOT_FOUND: "REPORT_BRANCH_NOT_FOUND",
  REVENUE_REPORT_LOADED: "REVENUE_REPORT_LOADED",
  REVENUE_REPORT_LOAD_FAILED: "REVENUE_REPORT_LOAD_FAILED",
  SUMMARY_LOADED: "REPORT_SUMMARY_LOADED",
  SUMMARY_LOAD_FAILED: "REPORT_SUMMARY_LOAD_FAILED",
  VALIDATION_ERROR: "REPORT_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with report response codes.
 */
export const REPORT_MESSAGES = {
  BOOKING_REPORT_LOADED: "Booking report loaded successfully.",
  BOOKING_REPORT_LOAD_FAILED: "Could not load booking report.",
  EXPENSE_REPORT_LOADED: "Expense report loaded successfully.",
  EXPENSE_REPORT_LOAD_FAILED: "Could not load expense report.",
  FORBIDDEN: "You do not have permission to view these reports.",
  PRODUCT_REPORT_LOADED: "Product report loaded successfully.",
  PRODUCT_REPORT_LOAD_FAILED: "Could not load product report.",
  REPORT_BRANCH_NOT_FOUND: "Selected branch was not found.",
  REVENUE_REPORT_LOADED: "Revenue report loaded successfully.",
  REVENUE_REPORT_LOAD_FAILED: "Could not load revenue report.",
  SUMMARY_LOADED: "Report summary loaded successfully.",
  SUMMARY_LOAD_FAILED: "Could not load report summary.",
  VALIDATION_ERROR: "Please check the report request and try again.",
} as const;
