/**
 * Stable machine-readable codes returned by product API responses.
 */
export const PRODUCT_CODES = {
  BRANCH_NOT_FOUND: "PRODUCT_BRANCH_NOT_FOUND",
  CATEGORY_CREATED: "PRODUCT_CATEGORY_CREATED",
  CATEGORY_CREATE_FAILED: "PRODUCT_CATEGORY_CREATE_FAILED",
  CATEGORY_LISTED: "PRODUCT_CATEGORY_LISTED",
  CATEGORY_NOT_FOUND: "PRODUCT_CATEGORY_NOT_FOUND",
  CATEGORY_UPDATED: "PRODUCT_CATEGORY_UPDATED",
  CATEGORY_UPDATE_FAILED: "PRODUCT_CATEGORY_UPDATE_FAILED",
  FORBIDDEN: "PRODUCT_FORBIDDEN",
  PRODUCT_CREATED: "PRODUCT_CREATED",
  PRODUCT_CREATE_FAILED: "PRODUCT_CREATE_FAILED",
  PRODUCT_LOADED: "PRODUCT_LOADED",
  PRODUCT_LOAD_FAILED: "PRODUCT_LOAD_FAILED",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  PRODUCT_UPDATED: "PRODUCT_UPDATED",
  PRODUCT_UPDATE_FAILED: "PRODUCT_UPDATE_FAILED",
  PRODUCTS_LISTED: "PRODUCTS_LISTED",
  PRODUCTS_LOAD_FAILED: "PRODUCTS_LOAD_FAILED",
  SLUG_DUPLICATE: "PRODUCT_SLUG_DUPLICATE",
  VALIDATION_ERROR: "PRODUCT_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with product response codes.
 */
export const PRODUCT_MESSAGES = {
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  CATEGORY_CREATED: "Product category created successfully.",
  CATEGORY_CREATE_FAILED: "Could not create product category.",
  CATEGORY_LISTED: "Product categories loaded successfully.",
  CATEGORY_NOT_FOUND: "Product category was not found.",
  CATEGORY_UPDATED: "Product category updated successfully.",
  CATEGORY_UPDATE_FAILED: "Could not update product category.",
  FORBIDDEN: "You do not have permission to manage this product.",
  PRODUCT_CREATED: "Product created successfully.",
  PRODUCT_CREATE_FAILED: "Could not create product.",
  PRODUCT_LOADED: "Product loaded successfully.",
  PRODUCT_LOAD_FAILED: "Could not load product.",
  PRODUCT_NOT_FOUND: "Product was not found.",
  PRODUCT_UPDATED: "Product updated successfully.",
  PRODUCT_UPDATE_FAILED: "Could not update product.",
  PRODUCTS_LISTED: "Products loaded successfully.",
  PRODUCTS_LOAD_FAILED: "Could not load products.",
  SLUG_DUPLICATE: "This product slug is already in use.",
  VALIDATION_ERROR: "Please check the product request and try again.",
} as const;
