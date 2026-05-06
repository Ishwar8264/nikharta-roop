/**
 * Stable machine-readable codes returned by notification API responses.
 */
export const NOTIFICATION_CODES = {
  FORBIDDEN: "NOTIFICATION_FORBIDDEN",
  NOTIFICATION_CREATED: "NOTIFICATION_CREATED",
  NOTIFICATION_CREATE_FAILED: "NOTIFICATION_CREATE_FAILED",
  NOTIFICATION_LISTED: "NOTIFICATION_LISTED",
  NOTIFICATION_LOAD_FAILED: "NOTIFICATION_LOAD_FAILED",
  NOTIFICATION_MARKED_READ: "NOTIFICATION_MARKED_READ",
  NOTIFICATION_MARK_READ_FAILED: "NOTIFICATION_MARK_READ_FAILED",
  NOTIFICATION_NOT_FOUND: "NOTIFICATION_NOT_FOUND",
  NOTIFICATION_UPDATED: "NOTIFICATION_UPDATED",
  NOTIFICATION_UPDATE_FAILED: "NOTIFICATION_UPDATE_FAILED",
  VALIDATION_ERROR: "NOTIFICATION_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with notification response codes.
 */
export const NOTIFICATION_MESSAGES = {
  FORBIDDEN: "You do not have permission to manage this notification.",
  NOTIFICATION_CREATED: "Notification created successfully.",
  NOTIFICATION_CREATE_FAILED: "Could not create notification.",
  NOTIFICATION_LISTED: "Notifications loaded successfully.",
  NOTIFICATION_LOAD_FAILED: "Could not load notifications.",
  NOTIFICATION_MARKED_READ: "Notification marked as read.",
  NOTIFICATION_MARK_READ_FAILED: "Could not mark notification as read.",
  NOTIFICATION_NOT_FOUND: "Notification was not found.",
  NOTIFICATION_UPDATED: "Notification updated successfully.",
  NOTIFICATION_UPDATE_FAILED: "Could not update notification.",
  VALIDATION_ERROR: "Please check the notification request and try again.",
} as const;
