/**
 * Purpose: Admin inventory stock adjustment handlers.
 * Responsibilities: authenticate admins, validate inventory scope, adjust stock, and record movement history.
 * Important notes: item update and transaction logging run together inside one database transaction.
 */
import { Prisma } from "@prisma/client";

import { getDb } from "@/db";
import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import {
  inventorySelect,
  inventoryTransactionSelect,
} from "@/features/inventory/helpers/inventory.selectors";
import { inventoryJson } from "@/features/inventory/responses/inventory.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  adjustInventorySchema,
  type AdjustInventoryInput,
} from "@/schema/inventory/schema.inventory";
import { handleInventoryError } from "./inventory.errors";
import { loadManageableInventory } from "./inventory.guards";
import {
  InventoryVisibleError,
  parseInventoryBody,
  requireInventoryAdmin,
} from "./inventory.shared";
import {
  toPublicInventory,
  toPublicInventoryTransaction,
} from "../helpers/inventory.mapper";

/**
 * Handles admin inventory stock adjustment requests.
 */
export async function handleAdjustInventory(request: Request, inventoryItemId: string) {
  const auth = await requireInventoryAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseInventoryBody(request, adjustInventorySchema);
  if (body.error) return body.error;
  return adjustInventory(inventoryItemId, body.data, auth.session.user);
}

/**
 * Applies a stock movement and records its transaction atomically.
 */
async function adjustInventory(
  inventoryItemId: string,
  input: AdjustInventoryInput,
  admin: { branchId?: string | null; id: string; role: string },
) {
  try {
    const current = await loadManageableInventory(inventoryItemId, admin);
    assertNonNegativeQuantity(current.quantityOnHand, input.quantityChange);
    const result = await getDb().$transaction(async (tx) => {
      const [item, transaction] = await Promise.all([
        tx.inventoryItem.update({
          data: { quantityOnHand: { increment: input.quantityChange } },
          select: inventorySelect(),
          where: { id: inventoryItemId },
        }),
        tx.inventoryTransaction.create({
          data: {
            inventoryItemId,
            notes: input.notes,
            quantityChange: input.quantityChange,
            type: input.type,
            unitCost: input.unitCost,
          },
          select: inventoryTransactionSelect(),
        }),
      ]);

      return { item, transaction };
    });
    return inventoryJson({
      code: INVENTORY_CODES.STOCK_ADJUSTED,
      data: {
        inventoryItem: toPublicInventory(result.item),
        transaction: toPublicInventoryTransaction(result.transaction),
      },
      message: INVENTORY_MESSAGES.STOCK_ADJUSTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleInventoryError(error, {
      code: INVENTORY_CODES.STOCK_ADJUST_FAILED,
      handler: "adjustInventory",
      message: INVENTORY_MESSAGES.STOCK_ADJUST_FAILED,
    });
  }
}

/**
 * Prevents adjustments from taking stock below zero.
 */
function assertNonNegativeQuantity(current: Prisma.Decimal, change: number) {
  if (current.add(change).gte(0)) return;
  throw new InventoryVisibleError(
    INVENTORY_CODES.STOCK_NEGATIVE,
    INVENTORY_MESSAGES.STOCK_NEGATIVE,
    HTTP_STATUS.CONFLICT,
  );
}
