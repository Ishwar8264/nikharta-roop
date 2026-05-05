/**
 * Stable machine-readable codes returned by product sale API responses.
 */
export const PRODUCT_SALE_CODES = {
  BRANCH_NOT_FOUND: "PRODUCT_SALE_BRANCH_NOT_FOUND",
  FORBIDDEN: "PRODUCT_SALE_FORBIDDEN",
  INVALID_STATUS: "PRODUCT_SALE_INVALID_STATUS",
  PRODUCT_NOT_FOUND: "PRODUCT_SALE_PRODUCT_NOT_FOUND",
  PRODUCT_SALE_CREATED: "PRODUCT_SALE_CREATED",
  PRODUCT_SALE_CREATE_FAILED: "PRODUCT_SALE_CREATE_FAILED",
  PRODUCT_SALE_LOADED: "PRODUCT_SALE_LOADED",
  PRODUCT_SALE_LOAD_FAILED: "PRODUCT_SALE_LOAD_FAILED",
  PRODUCT_SALE_NOT_FOUND: "PRODUCT_SALE_NOT_FOUND",
  PRODUCT_SALE_UPDATED: "PRODUCT_SALE_UPDATED",
  PRODUCT_SALE_UPDATE_FAILED: "PRODUCT_SALE_UPDATE_FAILED",
  PRODUCT_SALES_LISTED: "PRODUCT_SALES_LISTED",
  PRODUCT_SALES_LOAD_FAILED: "PRODUCT_SALES_LOAD_FAILED",
  STOCK_UNAVAILABLE: "PRODUCT_SALE_STOCK_UNAVAILABLE",
  VALIDATION_ERROR: "PRODUCT_SALE_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with product sale response codes.
 */
export const PRODUCT_SALE_MESSAGES = {
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  FORBIDDEN: "You do not have permission to manage this product sale.",
  INVALID_STATUS: "Product sale status transition is not allowed.",
  PRODUCT_NOT_FOUND: "Selected product was not found for this branch.",
  PRODUCT_SALE_CREATED: "Product sale created successfully.",
  PRODUCT_SALE_CREATE_FAILED: "Could not create product sale.",
  PRODUCT_SALE_LOADED: "Product sale loaded successfully.",
  PRODUCT_SALE_LOAD_FAILED: "Could not load product sale.",
  PRODUCT_SALE_NOT_FOUND: "Product sale was not found.",
  PRODUCT_SALE_UPDATED: "Product sale updated successfully.",
  PRODUCT_SALE_UPDATE_FAILED: "Could not update product sale.",
  PRODUCT_SALES_LISTED: "Product sales loaded successfully.",
  PRODUCT_SALES_LOAD_FAILED: "Could not load product sales.",
  STOCK_UNAVAILABLE: "One or more products do not have enough stock.",
  VALIDATION_ERROR: "Please check the product sale request and try again.",
} as const;
