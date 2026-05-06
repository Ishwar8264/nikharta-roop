export const runtime = "nodejs";

/**
 * Routes current user's loyalty transaction list requests to the feature handler.
 */
export { handleListMyLoyaltyTransactions as GET } from "@/features/loyalty/handlers/loyalty.handlers";
