export const REVIEW_CODES = {
  BOOKING_NOT_FOUND: "REVIEW_BOOKING_NOT_FOUND",
  FORBIDDEN: "REVIEW_FORBIDDEN",
  REVIEW_CREATED: "REVIEW_CREATED",
  REVIEW_CREATE_FAILED: "REVIEW_CREATE_FAILED",
  REVIEW_DUPLICATE: "REVIEW_DUPLICATE",
  REVIEW_LISTED: "REVIEW_LISTED",
  REVIEW_LIST_LOAD_FAILED: "REVIEW_LIST_LOAD_FAILED",
  REVIEW_NOT_FOUND: "REVIEW_NOT_FOUND",
  REVIEW_UPDATED: "REVIEW_UPDATED",
  REVIEW_UPDATE_FAILED: "REVIEW_UPDATE_FAILED",
  VALIDATION_ERROR: "REVIEW_VALIDATION_ERROR",
} as const;

export const REVIEW_MESSAGES = {
  BOOKING_NOT_FOUND: "Completed booking was not found for review.",
  FORBIDDEN: "You do not have permission to manage this review.",
  REVIEW_CREATED: "Review created successfully.",
  REVIEW_CREATE_FAILED: "Could not create review. Please try again later.",
  REVIEW_DUPLICATE: "This booking already has a review.",
  REVIEW_LISTED: "Reviews loaded successfully.",
  REVIEW_LIST_LOAD_FAILED: "Could not load reviews. Please try again later.",
  REVIEW_NOT_FOUND: "Review was not found.",
  REVIEW_UPDATED: "Review updated successfully.",
  REVIEW_UPDATE_FAILED: "Could not update review. Please try again later.",
  VALIDATION_ERROR: "Please check the review request and try again.",
} as const;
