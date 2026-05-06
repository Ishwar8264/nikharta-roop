import { getDb } from "@/db";
import { LOYALTY_CODES, LOYALTY_MESSAGES } from "@/features/loyalty/constants/loyalty.constants";
import { loyaltyTransactionSelect } from "@/features/loyalty/helpers/loyalty.selectors";
import { listLoyaltyTransactionsQuerySchema } from "@/schema/loyalty/schema.loyalty";
import { handleLoyaltyError } from "./loyalty.errors";
import { loyaltyTransactionListResponse, parseLoyaltyQuery } from "./loyalty-list.shared";
import { resolveLoyaltyBranchScope } from "./loyalty.guards";
import { requireLoyaltyAdmin } from "./loyalty.shared";

/**
 * Handles admin loyalty transaction listing requests.
 */
export async function handleListAdminLoyaltyTransactions(request: Request) {
  const auth = await requireLoyaltyAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseLoyaltyQuery(request, listLoyaltyTransactionsQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = resolveLoyaltyBranchScope(query.data.branchId, auth.session.user);
    const transactions = await getDb().loyaltyTransaction.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: loyaltyTransactionSelect(),
      take: query.data.limit,
      where: {
        type: query.data.type,
        ...(branchId ? { user: { branchId } } : {}),
        userId: query.data.userId,
      },
    });
    return loyaltyTransactionListResponse(transactions, query.data.limit);
  } catch (error) {
    return handleLoyaltyError(error, {
      code: LOYALTY_CODES.TRANSACTIONS_LOAD_FAILED,
      handler: "handleListAdminLoyaltyTransactions",
      message: LOYALTY_MESSAGES.TRANSACTIONS_LOAD_FAILED,
    });
  }
}
