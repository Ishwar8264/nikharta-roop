export const runtime = "nodejs";

/**
 * Routes admin inventory transaction listing requests to the feature handler.
 */
export { handleListInventoryTransactions as GET } from "@/features/inventory/handlers/inventory.handlers";
