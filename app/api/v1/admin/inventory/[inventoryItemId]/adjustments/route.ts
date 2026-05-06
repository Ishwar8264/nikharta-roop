import { handleAdjustInventory } from "@/features/inventory/handlers/inventory.handlers";

export const runtime = "nodejs";

type AdminInventoryAdjustmentRouteContext = {
  params: Promise<{ inventoryItemId: string }>;
};

/**
 * Routes admin inventory adjustment requests to the inventory feature handler.
 */
export async function POST(
  request: Request,
  context: AdminInventoryAdjustmentRouteContext,
) {
  const { inventoryItemId } = await context.params;
  return handleAdjustInventory(request, inventoryItemId);
}
