import { getDb } from "@/db";
import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  InventoryVisibleError,
  type InventoryAdminUser,
} from "./inventory.shared";

/**
 * Ensures branch admins only manage their assigned branch.
 */
export function assertCanManageInventoryBranch(
  admin: InventoryAdminUser,
  branchId: string,
) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;
  throw new InventoryVisibleError(
    INVENTORY_CODES.FORBIDDEN,
    INVENTORY_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Verifies the target branch is active before inventory writes.
 */
export async function assertActiveInventoryBranch(branchId: string) {
  const branch = await getDb().branch.findFirst({
    select: { id: true },
    where: { id: branchId, isActive: true },
  });
  if (branch) return;
  throw new InventoryVisibleError(
    INVENTORY_CODES.BRANCH_NOT_FOUND,
    INVENTORY_MESSAGES.BRANCH_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Loads one inventory item and validates branch ownership.
 */
export async function loadManageableInventory(
  inventoryItemId: string,
  admin: InventoryAdminUser,
) {
  const item = await getDb().inventoryItem.findUnique({
    select: { branchId: true, id: true, quantityOnHand: true },
    where: { id: inventoryItemId },
  });
  if (!item) throwInventoryNotFound();
  assertCanManageInventoryBranch(admin, item.branchId);
  return item;
}

/**
 * Throws an inventory item not-found error.
 */
export function throwInventoryNotFound(): never {
  throw new InventoryVisibleError(
    INVENTORY_CODES.INVENTORY_NOT_FOUND,
    INVENTORY_MESSAGES.INVENTORY_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
