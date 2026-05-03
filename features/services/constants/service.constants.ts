export const SERVICE_CODES = {
  BRANCH_NOT_FOUND: "SERVICE_BRANCH_NOT_FOUND",
  CATEGORIES_LISTED: "SERVICE_CATEGORIES_LISTED",
  CATEGORIES_LOAD_FAILED: "SERVICE_CATEGORIES_LOAD_FAILED",
  SERVICE_LOADED: "SERVICE_LOADED",
  SERVICE_LOAD_FAILED: "SERVICE_LOAD_FAILED",
  SERVICE_NOT_FOUND: "SERVICE_NOT_FOUND",
  SERVICES_LISTED: "SERVICES_LISTED",
  SERVICES_LOAD_FAILED: "SERVICES_LOAD_FAILED",
  VALIDATION_ERROR: "SERVICE_VALIDATION_ERROR",
} as const;

export const SERVICE_MESSAGES = {
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  CATEGORIES_LISTED: "Service categories loaded successfully.",
  CATEGORIES_LOAD_FAILED: "Could not load service categories. Please try again later.",
  SERVICE_LOADED: "Service loaded successfully.",
  SERVICE_LOAD_FAILED: "Could not load service. Please try again later.",
  SERVICE_NOT_FOUND: "Service was not found.",
  SERVICES_LISTED: "Services loaded successfully.",
  SERVICES_LOAD_FAILED: "Could not load services. Please try again later.",
  VALIDATION_ERROR: "Please check the service request and try again.",
} as const;
