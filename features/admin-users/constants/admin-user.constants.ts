/**
 * Stable machine-readable codes returned by admin user API responses.
 */
export const ADMIN_USER_CODES = {
  BRANCH_NOT_FOUND: "ADMIN_USER_BRANCH_NOT_FOUND",
  FORBIDDEN: "ADMIN_USER_FORBIDDEN",
  USER_LISTED: "ADMIN_USER_LISTED",
  USER_LOAD_FAILED: "ADMIN_USER_LOAD_FAILED",
  USER_LOADED: "ADMIN_USER_LOADED",
  USER_NOT_FOUND: "ADMIN_USER_NOT_FOUND",
  USER_UPDATED: "ADMIN_USER_UPDATED",
  USER_UPDATE_FAILED: "ADMIN_USER_UPDATE_FAILED",
  VALIDATION_ERROR: "ADMIN_USER_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with admin user response codes.
 */
export const ADMIN_USER_MESSAGES = {
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  FORBIDDEN: "You do not have permission to manage this user.",
  USER_LISTED: "Users loaded successfully.",
  USER_LOAD_FAILED: "Could not load users.",
  USER_LOADED: "User loaded successfully.",
  USER_NOT_FOUND: "User was not found.",
  USER_UPDATED: "User updated successfully.",
  USER_UPDATE_FAILED: "Could not update user.",
  VALIDATION_ERROR: "Please check the user request and try again.",
} as const;
