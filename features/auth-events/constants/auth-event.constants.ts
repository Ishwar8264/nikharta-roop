/**
 * Stable machine-readable codes returned by auth event API responses.
 */
export const AUTH_EVENT_CODES = {
  EVENT_LISTED: "AUTH_EVENT_LISTED",
  EVENT_LOAD_FAILED: "AUTH_EVENT_LOAD_FAILED",
  EVENT_LOADED: "AUTH_EVENT_LOADED",
  EVENT_NOT_FOUND: "AUTH_EVENT_NOT_FOUND",
  FORBIDDEN: "AUTH_EVENT_FORBIDDEN",
  VALIDATION_ERROR: "AUTH_EVENT_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with auth event response codes.
 */
export const AUTH_EVENT_MESSAGES = {
  EVENT_LISTED: "Auth events loaded successfully.",
  EVENT_LOAD_FAILED: "Could not load auth events.",
  EVENT_LOADED: "Auth event loaded successfully.",
  EVENT_NOT_FOUND: "Auth event was not found.",
  FORBIDDEN: "You do not have permission to view these auth events.",
  VALIDATION_ERROR: "Please check the auth event request and try again.",
} as const;
