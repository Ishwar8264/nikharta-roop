export const runtime = "nodejs";

/**
 * Routes admin inventory list and create requests to feature handlers.
 */
export {
  handleCreateInventory as POST,
  handleListInventory as GET,
} from "@/features/inventory/handlers/inventory.handlers";
