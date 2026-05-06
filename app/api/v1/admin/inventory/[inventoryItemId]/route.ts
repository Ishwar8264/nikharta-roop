import { handleUpdateInventory } from "@/features/inventory/handlers/inventory.handlers";

export const runtime = "nodejs";

type AdminInventoryRouteContext = {
  params: Promise<{ inventoryItemId: string }>;
};

/**
 * Routes admin inventory patch requests to the inventory feature handler.
 */
export async function PATCH(
  request: Request,
  context: AdminInventoryRouteContext,
) {
  const { inventoryItemId } = await context.params;
  return handleUpdateInventory(request, inventoryItemId);
}
