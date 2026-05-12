import { getDb } from "@/db";
import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import { inventorySelect } from "@/features/inventory/helpers/inventory.selectors";
import { listInventoryQuerySchema } from "@/schema/inventory/schema.inventory";
import { handleInventoryError } from "./inventory.errors";
import { inventoryListResponse, parseInventoryQuery } from "./inventory-list.shared";
import { resolveInventoryBranch } from "./inventory.relations";
import { requireInventoryAdmin } from "./inventory.shared";

/**
 * Handles admin inventory item listing requests.
 */
export async function handleListInventory(request: Request) {
  const auth = await requireInventoryAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseInventoryQuery(request, listInventoryQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = resolveInventoryBranch(query.data.branchId, auth.session.user);
    const items = await getDb().inventoryItem.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: inventorySelect(),
      take: query.data.limit ?? 50,
      where: {
        branchId,
        isActive: query.data.isActive,
        productId: query.data.productId,
      },
    });
    return inventoryListResponse(items, query.data.limit ?? 50);
  } catch (error) {
    return handleInventoryError(error, {
      code: INVENTORY_CODES.INVENTORY_LOAD_FAILED,
      handler: "handleListInventory",
      message: INVENTORY_MESSAGES.INVENTORY_LOAD_FAILED,
    });
  }
}
