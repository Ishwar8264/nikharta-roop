/**
 * Stable machine-readable codes returned by expense API responses.
 */
export const EXPENSE_CODES = {
  BRANCH_NOT_FOUND: "EXPENSE_BRANCH_NOT_FOUND",
  EXPENSE_CREATED: "EXPENSE_CREATED",
  EXPENSE_CREATE_FAILED: "EXPENSE_CREATE_FAILED",
  EXPENSE_LISTED: "EXPENSE_LISTED",
  EXPENSE_LOAD_FAILED: "EXPENSE_LOAD_FAILED",
  EXPENSE_NOT_FOUND: "EXPENSE_NOT_FOUND",
  EXPENSE_UPDATED: "EXPENSE_UPDATED",
  EXPENSE_UPDATE_FAILED: "EXPENSE_UPDATE_FAILED",
  FORBIDDEN: "EXPENSE_FORBIDDEN",
  VALIDATION_ERROR: "EXPENSE_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with expense response codes.
 */
export const EXPENSE_MESSAGES = {
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  EXPENSE_CREATED: "Expense created successfully.",
  EXPENSE_CREATE_FAILED: "Could not create expense.",
  EXPENSE_LISTED: "Expenses loaded successfully.",
  EXPENSE_LOAD_FAILED: "Could not load expenses.",
  EXPENSE_NOT_FOUND: "Expense was not found.",
  EXPENSE_UPDATED: "Expense updated successfully.",
  EXPENSE_UPDATE_FAILED: "Could not update expense.",
  FORBIDDEN: "You do not have permission to manage this expense.",
  VALIDATION_ERROR: "Please check the expense request and try again.",
} as const;
