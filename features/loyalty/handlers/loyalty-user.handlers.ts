import { getDb } from "@/db";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { LOYALTY_CODES, LOYALTY_MESSAGES } from "@/features/loyalty/constants/loyalty.constants";
import { toPublicLoyaltySummary } from "@/features/loyalty/helpers/loyalty.mapper";
import { loyaltyTransactionSelect, loyaltyUserSelect } from "@/features/loyalty/helpers/loyalty.selectors";
import { loyaltyJson } from "@/features/loyalty/responses/loyalty.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { listMyLoyaltyTransactionsQuerySchema } from "@/schema/loyalty/schema.loyalty";
import { handleLoyaltyError, throwLoyaltyUserNotFound } from "./loyalty.errors";
import { loyaltyTransactionListResponse, parseLoyaltyQuery } from "./loyalty-list.shared";

/**
 * Handles current user's loyalty balance summary requests.
 */
export async function handleGetMyLoyalty(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth.error;
  try {
    const user = await getDb().user.findUnique({
      select: loyaltyUserSelect(),
      where: { id: auth.session.userId },
    });
    if (!user) throwLoyaltyUserNotFound();
    return loyaltyJson({
      code: LOYALTY_CODES.LOYALTY_SUMMARY_LOADED,
      data: toPublicLoyaltySummary(user),
      message: LOYALTY_MESSAGES.LOYALTY_SUMMARY_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleLoyaltyError(error, {
      code: LOYALTY_CODES.LOYALTY_SUMMARY_LOAD_FAILED,
      handler: "handleGetMyLoyalty",
      message: LOYALTY_MESSAGES.LOYALTY_SUMMARY_LOAD_FAILED,
    });
  }
}

/**
 * Handles current user's loyalty transaction listing requests.
 */
export async function handleListMyLoyaltyTransactions(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth.error;
  const query = parseLoyaltyQuery(request, listMyLoyaltyTransactionsQuerySchema);
  if (!query.success) return query.error;
  try {
    const transactions = await getDb().loyaltyTransaction.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: loyaltyTransactionSelect(),
      take: query.data.limit,
      where: { type: query.data.type, userId: auth.session.userId },
    });
    return loyaltyTransactionListResponse(transactions, query.data.limit);
  } catch (error) {
    return handleLoyaltyError(error, {
      code: LOYALTY_CODES.TRANSACTIONS_LOAD_FAILED,
      handler: "handleListMyLoyaltyTransactions",
      message: LOYALTY_MESSAGES.TRANSACTIONS_LOAD_FAILED,
    });
  }
}
