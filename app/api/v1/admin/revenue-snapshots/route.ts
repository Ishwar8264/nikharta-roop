export const runtime = "nodejs";

/**
 * Routes admin revenue snapshot list and create requests to feature handlers.
 */
export {
  handleCreateRevenueSnapshot as POST,
  handleListRevenueSnapshots as GET,
} from "@/features/revenue-snapshots/handlers/revenue-snapshot.handlers";
