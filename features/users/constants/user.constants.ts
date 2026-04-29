export const USER_CODES = {
  PROFILE_LOADED: "USER_PROFILE_LOADED",
  PROFILE_UPDATED: "USER_PROFILE_UPDATED",
  PROFILE_LOAD_FAILED: "USER_PROFILE_LOAD_FAILED",
  PROFILE_UPDATE_FAILED: "USER_PROFILE_UPDATE_FAILED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export const USER_MESSAGES = {
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_NAME: "Name must be between 2 and 100 characters.",
  INVALID_PROFILE_PAYLOAD: "Please provide at least one profile field.",
  INVALID_REQUEST_BODY: "Request body is invalid.",
  PROFILE_LOADED: "Profile loaded successfully.",
  PROFILE_LOAD_FAILED: "Could not load profile. Please try again later.",
  PROFILE_UPDATED: "Profile updated successfully.",
  PROFILE_UPDATE_FAILED: "Could not update profile. Please try again later.",
} as const;
