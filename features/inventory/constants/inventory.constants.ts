/**
 * Stable machine-readable codes returned by inventory API responses.
 */
export const INVENTORY_CODES = {
  BRANCH_NOT_FOUND: "INVENTORY_BRANCH_NOT_FOUND",
  FORBIDDEN: "INVENTORY_FORBIDDEN",
  INVENTORY_CREATED: "INVENTORY_CREATED",
  INVENTORY_CREATE_FAILED: "INVENTORY_CREATE_FAILED",
  INVENTORY_LISTED: "INVENTORY_LISTED",
  INVENTORY_LOAD_FAILED: "INVENTORY_LOAD_FAILED",
  INVENTORY_NOT_FOUND: "INVENTORY_NOT_FOUND",
  INVENTORY_UPDATED: "INVENTORY_UPDATED",
  INVENTORY_UPDATE_FAILED: "INVENTORY_UPDATE_FAILED",
  PRODUCT_NOT_FOUND: "INVENTORY_PRODUCT_NOT_FOUND",
  SKU_DUPLICATE: "INVENTORY_SKU_DUPLICATE",
  STOCK_ADJUSTED: "INVENTORY_STOCK_ADJUSTED",
  STOCK_ADJUST_FAILED: "INVENTORY_STOCK_ADJUST_FAILED",
  STOCK_NEGATIVE: "INVENTORY_STOCK_NEGATIVE",
  TRANSACTIONS_LISTED: "INVENTORY_TRANSACTIONS_LISTED",
  TRANSACTIONS_LOAD_FAILED: "INVENTORY_TRANSACTIONS_LOAD_FAILED",
  VALIDATION_ERROR: "INVENTORY_VALIDATION_ERROR",
} as const;

/**
 * User-safe messages paired with inventory response codes.
 */
export const INVENTORY_MESSAGES = {
  BRANCH_NOT_FOUND: "Selected branch was not found.",
  FORBIDDEN: "You do not have permission to manage this inventory.",
  INVENTORY_CREATED: "Inventory item created successfully.",
  INVENTORY_CREATE_FAILED: "Could not create inventory item.",
  INVENTORY_LISTED: "Inventory items loaded successfully.",
  INVENTORY_LOAD_FAILED: "Could not load inventory items.",
  INVENTORY_NOT_FOUND: "Inventory item was not found.",
  INVENTORY_UPDATED: "Inventory item updated successfully.",
  INVENTORY_UPDATE_FAILED: "Could not update inventory item.",
  PRODUCT_NOT_FOUND: "Selected product was not found for this branch.",
  SKU_DUPLICATE: "This SKU is already in use for the selected branch.",
  STOCK_ADJUSTED: "Inventory stock adjusted successfully.",
  STOCK_ADJUST_FAILED: "Could not adjust inventory stock.",
  STOCK_NEGATIVE: "Inventory quantity cannot become negative.",
  TRANSACTIONS_LISTED: "Inventory transactions loaded successfully.",
  TRANSACTIONS_LOAD_FAILED: "Could not load inventory transactions.",
  VALIDATION_ERROR: "Please check the inventory request and try again.",
} as const;
