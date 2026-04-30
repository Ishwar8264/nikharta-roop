export const BRANCH_CODES = {
  BRANCH_LOADED: "BRANCH_LOADED",
  BRANCH_LOAD_FAILED: "BRANCH_LOAD_FAILED",
  BRANCH_NOT_FOUND: "BRANCH_NOT_FOUND",
  BRANCHES_LISTED: "BRANCHES_LISTED",
  BRANCHES_LOAD_FAILED: "BRANCHES_LOAD_FAILED",
} as const;

export const BRANCH_MESSAGES = {
  BRANCH_LOADED: "Branch loaded successfully.",
  BRANCH_LOAD_FAILED: "Could not load branch. Please try again later.",
  BRANCH_NOT_FOUND: "Branch was not found.",
  BRANCHES_LISTED: "Branches loaded successfully.",
  BRANCHES_LOAD_FAILED: "Could not load branches. Please try again later.",
} as const;
