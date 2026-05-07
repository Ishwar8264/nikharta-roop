/**
 * Stable machine-readable codes returned by revenue snapshot API responses.
 */
export const REVENUE_SNAPSHOT_CODES = {
  BRANCH_NOT_FOUND: "REVENUE_SNAPSHOT_BRANCH_NOT_FOUND",
  FORBIDDEN: "REVENUE_SNAPSHOT_FORBIDDEN",
  SNAPSHOT_CREATED: "REVENUE_SNAPSHOT_CREATED",
  SNAPSHOT_CREATE_FAILED: "REVENUE_SNAPSHOT_CREATE_FAILED",
  SNAPSHOT_DUPLICATE: "REVENUE_SNAPSHOT_DUPLICATE",
  SNAPSHOT_LISTED: "REVENUE_SNAPSHOT_LISTED",
  SNAPSHOT_LOAD_FAILED: "REVENUE_SNAPSHOT_LOAD_FAILED",
  SNAPSHOT_NOT_FOUND: "REVENUE_SNAPSHOT_NOT_FOUND",
  SNAPSHOT_UPDATED: "REVENUE_SNAPSHOT_UPDATED",
  SNAPSHOT_UPDATE_FAILED: "REVENUE_SNAPSHOT_UPDATE_FAILED",
  VALIDATION_ERROR: "REVENUE_SNAPSHOT_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with revenue snapshot response codes.
 */
export const REVENUE_SNAPSHOT_MESSAGES = {
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  FORBIDDEN: "You do not have permission to manage this revenue snapshot.",
  SNAPSHOT_CREATED: "Revenue snapshot created successfully.",
  SNAPSHOT_CREATE_FAILED: "Could not create revenue snapshot.",
  SNAPSHOT_DUPLICATE: "A revenue snapshot already exists for this branch and date.",
  SNAPSHOT_LISTED: "Revenue snapshots loaded successfully.",
  SNAPSHOT_LOAD_FAILED: "Could not load revenue snapshots.",
  SNAPSHOT_NOT_FOUND: "Revenue snapshot was not found.",
  SNAPSHOT_UPDATED: "Revenue snapshot updated successfully.",
  SNAPSHOT_UPDATE_FAILED: "Could not update revenue snapshot.",
  VALIDATION_ERROR: "Please check the revenue snapshot request and try again.",
} as const;
