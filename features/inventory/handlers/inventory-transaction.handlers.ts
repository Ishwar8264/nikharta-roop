import { getDb } from "@/db";
import {
  INVENTORY_CODES,
  INVENTORY_MESSAGES,
} from "@/features/inventory/constants/inventory.constants";
import { inventoryTransactionSelect } from "@/features/inventory/helpers/inventory.selectors";
import { listInventoryTransactionsQuerySchema } from "@/schema/inventory/schema.inventory";
import { handleInventoryError } from "./inventory.errors";
import { loadManageableInventory } from "./inventory.guards";
import {
  inventoryTransactionListResponse,
  parseInventoryQuery,
} from "./inventory-list.shared";
import { resolveInventoryBranch } from "./inventory.relations";
import { requireInventoryAdmin } from "./inventory.shared";

/**
 * Handles admin inventory transaction listing requests.
 */
export async function handleListInventoryTransactions(request: Request) {
  const auth = await requireInventoryAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseInventoryQuery(request, listInventoryTransactionsQuerySchema);
  if (!query.success) return query.error;
  try {
    if (query.data.inventoryItemId) {
      await loadManageableInventory(query.data.inventoryItemId, auth.session.user);
    }
    const branchId = resolveInventoryBranch(query.data.branchId, auth.session.user);
    const transactions = await getDb().inventoryTransaction.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: inventoryTransactionSelect(),
      take: query.data.limit,
      where: {
        inventoryItem: { branchId },
        inventoryItemId: query.data.inventoryItemId,
        type: query.data.type,
      },
    });
    return inventoryTransactionListResponse(transactions, query.data.limit);
  } catch (error) {
    return handleInventoryError(error, {
      code: INVENTORY_CODES.TRANSACTIONS_LOAD_FAILED,
      handler: "handleListInventoryTransactions",
      message: INVENTORY_MESSAGES.TRANSACTIONS_LOAD_FAILED,
    });
  }
}
