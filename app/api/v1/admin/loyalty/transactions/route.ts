export const runtime = "nodejs";

/**
 * Routes admin loyalty transaction list and create requests to feature handlers.
 */
export {
  handleCreateAdminLoyaltyTransaction as POST,
  handleListAdminLoyaltyTransactions as GET,
} from "@/features/loyalty/handlers/loyalty.handlers";
