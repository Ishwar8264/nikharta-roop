/**
 * Purpose: Admin inventory create/update handlers.
 * Responsibilities: authenticate admins, validate branch/product scope, and persist inventory items.
 * Important notes: independent branch and product checks run together before writes.
 */
import { getDb } from "@/db";
import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import { inventorySelect } from "@/features/inventory/helpers/inventory.selectors";
import {
  createInventorySchema,
  updateInventorySchema,
  type CreateInventoryInput,
  type UpdateInventoryInput,
} from "@/schema/inventory/schema.inventory";
import { handleInventoryError } from "./inventory.errors";
import {
  assertActiveInventoryBranch,
  assertCanManageInventoryBranch,
  loadManageableInventory,
} from "./inventory.guards";
import { assertInventoryProduct } from "./inventory.relations";
import { parseInventoryBody, requireInventoryAdmin, type InventoryAdminUser } from "./inventory.shared";
import { inventoryWriteResponse } from "./inventory-write.responses";

/**
 * Handles admin inventory creation requests.
 */
export async function handleCreateInventory(request: Request) {
  const auth = await requireInventoryAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseInventoryBody(request, createInventorySchema);
  if (body.error) return body.error;
  return createInventory(body.data, auth.session.user);
}

/**
 * Handles admin inventory patch requests.
 */
export async function handleUpdateInventory(request: Request, inventoryItemId: string) {
  const auth = await requireInventoryAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseInventoryBody(request, updateInventorySchema);
  if (body.error) return body.error;
  return updateInventory(inventoryItemId, body.data, auth.session.user);
}

/**
 * Creates one inventory item after branch and product validation.
 */
async function createInventory(input: CreateInventoryInput, admin: InventoryAdminUser) {
  try {
    assertCanManageInventoryBranch(admin, input.branchId);
    await Promise.all([
      assertActiveInventoryBranch(input.branchId),
      assertInventoryProduct(input.productId, input.branchId),
    ]);
    const item = await getDb().inventoryItem.create({
      data: input,
      select: inventorySelect(),
    });
    return inventoryWriteResponse(item, INVENTORY_CODES.INVENTORY_CREATED);
  } catch (error) {
    return handleInventoryError(error, {
      code: INVENTORY_CODES.INVENTORY_CREATE_FAILED,
      handler: "createInventory",
      message: INVENTORY_MESSAGES.INVENTORY_CREATE_FAILED,
    });
  }
}

/**
 * Updates one inventory item while preserving branch ownership.
 */
async function updateInventory(
  inventoryItemId: string,
  input: UpdateInventoryInput,
  admin: InventoryAdminUser,
) {
  try {
    const current = await loadManageableInventory(inventoryItemId, admin);
    const branchId = input.branchId ?? current.branchId;
    assertCanManageInventoryBranch(admin, branchId);
    await Promise.all([
      assertActiveInventoryBranch(branchId),
      assertInventoryProduct(input.productId, branchId),
    ]);
    const item = await getDb().inventoryItem.update({
      data: input,
      select: inventorySelect(),
      where: { id: inventoryItemId },
    });
    return inventoryWriteResponse(item, INVENTORY_CODES.INVENTORY_UPDATED);
  } catch (error) {
    return handleInventoryError(error, {
      code: INVENTORY_CODES.INVENTORY_UPDATE_FAILED,
      handler: "updateInventory",
      message: INVENTORY_MESSAGES.INVENTORY_UPDATE_FAILED,
    });
  }
}
