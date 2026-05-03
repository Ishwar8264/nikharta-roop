export const BRANCH_CODES = {
  BRANCH_CREATED: "BRANCH_CREATED",
  BRANCH_CREATE_FAILED: "BRANCH_CREATE_FAILED",
  BRANCH_DUPLICATE: "BRANCH_DUPLICATE",
  BRANCH_LOADED: "BRANCH_LOADED",
  BRANCH_LOAD_FAILED: "BRANCH_LOAD_FAILED",
  BRANCH_NOT_FOUND: "BRANCH_NOT_FOUND",
  BRANCH_UPDATED: "BRANCH_UPDATED",
  BRANCH_UPDATE_FAILED: "BRANCH_UPDATE_FAILED",
  VALIDATION_ERROR: "BRANCH_VALIDATION_ERROR",
  BRANCHES_LISTED: "BRANCHES_LISTED",
  BRANCHES_LOAD_FAILED: "BRANCHES_LOAD_FAILED",
  FORBIDDEN: "BRANCH_FORBIDDEN",
} as const;

export const BRANCH_MESSAGES = {
  BRANCH_CREATED: "Branch created successfully.",
  BRANCH_CREATE_FAILED: "Could not create branch. Please try again later.",
  BRANCH_DUPLICATE: "A branch with this name, city, or phone already exists.",
  BRANCH_LOADED: "Branch loaded successfully.",
  BRANCH_LOAD_FAILED: "Could not load branch. Please try again later.",
  BRANCH_NOT_FOUND: "Branch was not found.",
  BRANCH_UPDATED: "Branch updated successfully.",
  BRANCH_UPDATE_FAILED: "Could not update branch. Please try again later.",
  VALIDATION_ERROR: "Please check the branch details and try again.",
  BRANCHES_LISTED: "Branches loaded successfully.",
  BRANCHES_LOAD_FAILED: "Could not load branches. Please try again later.",
  FORBIDDEN: "Only admins can manage branches.",
} as const;
