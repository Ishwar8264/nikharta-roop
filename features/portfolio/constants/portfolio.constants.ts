/**
 * Stable machine-readable codes returned by portfolio API responses.
 */
export const PORTFOLIO_CODES = {
  BRANCH_NOT_FOUND: "PORTFOLIO_BRANCH_NOT_FOUND",
  FORBIDDEN: "PORTFOLIO_FORBIDDEN",
  PACKAGE_NOT_FOUND: "PORTFOLIO_PACKAGE_NOT_FOUND",
  PORTFOLIO_CREATED: "PORTFOLIO_CREATED",
  PORTFOLIO_CREATE_FAILED: "PORTFOLIO_CREATE_FAILED",
  PORTFOLIO_DELETED: "PORTFOLIO_DELETED",
  PORTFOLIO_DELETE_FAILED: "PORTFOLIO_DELETE_FAILED",
  PORTFOLIO_LISTED: "PORTFOLIO_LISTED",
  PORTFOLIO_LOAD_FAILED: "PORTFOLIO_LOAD_FAILED",
  PORTFOLIO_NOT_FOUND: "PORTFOLIO_NOT_FOUND",
  PORTFOLIO_UPDATED: "PORTFOLIO_UPDATED",
  PORTFOLIO_UPDATE_FAILED: "PORTFOLIO_UPDATE_FAILED",
  SERVICE_NOT_FOUND: "PORTFOLIO_SERVICE_NOT_FOUND",
  STAFF_NOT_FOUND: "PORTFOLIO_STAFF_NOT_FOUND",
  VALIDATION_ERROR: "PORTFOLIO_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with portfolio response codes.
 */
export const PORTFOLIO_MESSAGES = {
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  FORBIDDEN: "You do not have permission to manage this portfolio item.",
  PACKAGE_NOT_FOUND: "Selected package was not found for this branch.",
  PORTFOLIO_CREATED: "Portfolio item created successfully.",
  PORTFOLIO_CREATE_FAILED: "Could not create portfolio item.",
  PORTFOLIO_DELETED: "Portfolio item deleted successfully.",
  PORTFOLIO_DELETE_FAILED: "Could not delete portfolio item.",
  PORTFOLIO_LISTED: "Portfolio items loaded successfully.",
  PORTFOLIO_LOAD_FAILED: "Could not load portfolio items.",
  PORTFOLIO_NOT_FOUND: "Portfolio item was not found.",
  PORTFOLIO_UPDATED: "Portfolio item updated successfully.",
  PORTFOLIO_UPDATE_FAILED: "Could not update portfolio item.",
  SERVICE_NOT_FOUND: "Selected service was not found for this branch.",
  STAFF_NOT_FOUND: "Selected staff member was not found for this branch.",
  VALIDATION_ERROR: "Please check the portfolio request and try again.",
} as const;
