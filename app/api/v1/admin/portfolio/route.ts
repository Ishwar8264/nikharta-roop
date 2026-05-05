export const runtime = "nodejs";

/**
 * Routes admin portfolio list and create requests to feature handlers.
 */
export {
  handleCreateAdminPortfolio as POST,
  handleListAdminPortfolio as GET,
} from "@/features/portfolio/handlers/portfolio.handlers";
