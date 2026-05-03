export const BOOKING_CODES = {
  BOOKING_SLOTS_LOAD_FAILED: "BOOKING_SLOTS_LOAD_FAILED",
  BOOKING_SLOTS_LISTED: "BOOKING_SLOTS_LISTED",
  BRANCH_NOT_FOUND: "BOOKING_BRANCH_NOT_FOUND",
  SERVICE_NOT_FOUND: "BOOKING_SERVICE_NOT_FOUND",
  STAFF_NOT_FOUND: "BOOKING_STAFF_NOT_FOUND",
  VALIDATION_ERROR: "BOOKING_VALIDATION_ERROR",
  VARIANT_NOT_FOUND: "BOOKING_VARIANT_NOT_FOUND",
} as const;

export const BOOKING_MESSAGES = {
  BOOKING_SLOTS_LOAD_FAILED: "Could not load booking slots. Please try again later.",
  BOOKING_SLOTS_LISTED: "Booking slots loaded successfully.",
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  SERVICE_NOT_FOUND: "Selected service was not found.",
  STAFF_NOT_FOUND: "Selected staff member was not found for this service.",
  VALIDATION_ERROR: "Please check the booking request and try again.",
  VARIANT_NOT_FOUND: "Selected service variant was not found.",
} as const;
