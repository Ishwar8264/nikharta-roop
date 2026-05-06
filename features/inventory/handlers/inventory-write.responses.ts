import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import { toPublicInventory } from "@/features/inventory/helpers/inventory.mapper";
import { inventoryJson } from "@/features/inventory/responses/inventory.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Wraps an inventory write result in the shared response shape.
 */
export function inventoryWriteResponse(
  item: Parameters<typeof toPublicInventory>[0],
  code: string,
) {
  const created = code === INVENTORY_CODES.INVENTORY_CREATED;
  return inventoryJson({
    code,
    data: { inventoryItem: toPublicInventory(item) },
    message: created
      ? INVENTORY_MESSAGES.INVENTORY_CREATED
      : INVENTORY_MESSAGES.INVENTORY_UPDATED,
    status: created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK,
    success: true,
  });
}
