import { handleUpdateRevenueSnapshot } from "@/features/revenue-snapshots/handlers/revenue-snapshot.handlers";

export const runtime = "nodejs";

type AdminRevenueSnapshotRouteContext = {
  params: Promise<{ snapshotId: string }>;
};

/**
 * Routes admin revenue snapshot patch requests to the feature handler.
 */
export async function PATCH(
  request: Request,
  context: AdminRevenueSnapshotRouteContext,
) {
  const { snapshotId } = await context.params;
  return handleUpdateRevenueSnapshot(request, snapshotId);
}
