/**
 * Stable machine-readable codes returned by media API responses.
 */
export const MEDIA_CODES = {
  FORBIDDEN: "MEDIA_FORBIDDEN",
  MEDIA_CREATED: "MEDIA_CREATED",
  MEDIA_CREATE_FAILED: "MEDIA_CREATE_FAILED",
  MEDIA_DELETED: "MEDIA_DELETED",
  MEDIA_DELETE_FAILED: "MEDIA_DELETE_FAILED",
  MEDIA_LISTED: "MEDIA_LISTED",
  MEDIA_LOAD_FAILED: "MEDIA_LOAD_FAILED",
  MEDIA_NOT_FOUND: "MEDIA_NOT_FOUND",
  MEDIA_OWNER_NOT_FOUND: "MEDIA_OWNER_NOT_FOUND",
  MEDIA_UPDATED: "MEDIA_UPDATED",
  MEDIA_UPDATE_FAILED: "MEDIA_UPDATE_FAILED",
  VALIDATION_ERROR: "MEDIA_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with media response codes.
 */
export const MEDIA_MESSAGES = {
  FORBIDDEN: "You do not have permission to manage this media asset.",
  MEDIA_CREATED: "Media asset created successfully.",
  MEDIA_CREATE_FAILED: "Could not create media asset.",
  MEDIA_DELETED: "Media asset deleted successfully.",
  MEDIA_DELETE_FAILED: "Could not delete media asset.",
  MEDIA_LISTED: "Media assets loaded successfully.",
  MEDIA_LOAD_FAILED: "Could not load media assets.",
  MEDIA_NOT_FOUND: "Media asset was not found.",
  MEDIA_OWNER_NOT_FOUND: "Selected media owner was not found.",
  MEDIA_UPDATED: "Media asset updated successfully.",
  MEDIA_UPDATE_FAILED: "Could not update media asset.",
  VALIDATION_ERROR: "Please check the media request and try again.",
} as const;
