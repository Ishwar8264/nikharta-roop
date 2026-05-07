import { getDb } from "@/db";
import {
  REVENUE_SNAPSHOT_CODES,
  REVENUE_SNAPSHOT_MESSAGES,
} from "@/features/revenue-snapshots/constants/revenue-snapshot.constants";
import { revenueSnapshotSelect } from "@/features/revenue-snapshots/helpers/revenue-snapshot.selectors";
import {
  listRevenueSnapshotsQuerySchema,
  type ListRevenueSnapshotsQueryInput,
} from "@/schema/revenue-snapshots/schema.revenue-snapshot";
import { handleRevenueSnapshotError } from "./revenue-snapshot.errors";
import { resolveRevenueSnapshotBranch } from "./revenue-snapshot.guards";
import {
  parseRevenueSnapshotQuery,
  revenueSnapshotListResponse,
} from "./revenue-snapshot-list.shared";
import { requireRevenueSnapshotAdmin } from "./revenue-snapshot.shared";

/**
 * Handles admin revenue snapshot listing requests.
 */
export async function handleListRevenueSnapshots(request: Request) {
  const auth = await requireRevenueSnapshotAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseRevenueSnapshotQuery(request, listRevenueSnapshotsQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = await resolveRevenueSnapshotBranch(
      query.data.branchId,
      auth.session.user,
    );
    const snapshots = await getDb().revenueSnapshot.findMany({
      orderBy: [{ date: "desc" }],
      select: revenueSnapshotSelect(),
      take: query.data.limit,
      where: { branchId, date: snapshotDateRange(query.data) },
    });
    return revenueSnapshotListResponse(snapshots, query.data.limit);
  } catch (error) {
    return handleRevenueSnapshotError(error, {
      code: REVENUE_SNAPSHOT_CODES.SNAPSHOT_LOAD_FAILED,
      handler: "handleListRevenueSnapshots",
      message: REVENUE_SNAPSHOT_MESSAGES.SNAPSHOT_LOAD_FAILED,
    });
  }
}

/**
 * Builds optional date-only range filters for revenue snapshots.
 */
function snapshotDateRange(input: ListRevenueSnapshotsQueryInput) {
  return {
    gte: input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined,
    lte: input.to ? new Date(`${input.to}T00:00:00.000Z`) : undefined,
  };
}
