/**
 * Stable machine-readable codes returned by admin dashboard API responses.
 */
export const ADMIN_DASHBOARD_CODES = {
  DASHBOARD_LOAD_FAILED: "ADMIN_DASHBOARD_LOAD_FAILED",
  DASHBOARD_LOADED: "ADMIN_DASHBOARD_LOADED",
  FORBIDDEN: "ADMIN_DASHBOARD_FORBIDDEN",
} as const;

/**
 * User-safe messages paired with admin dashboard response codes.
 */
export const ADMIN_DASHBOARD_MESSAGES = {
  DASHBOARD_LOAD_FAILED: "Could not load dashboard.",
  DASHBOARD_LOADED: "Dashboard loaded successfully.",
  FORBIDDEN: "You do not have permission to view this dashboard.",
} as const;
