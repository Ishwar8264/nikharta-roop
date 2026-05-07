import {
  REVENUE_SNAPSHOT_CODES,
  REVENUE_SNAPSHOT_MESSAGES,
} from "@/features/revenue-snapshots/constants/revenue-snapshot.constants";
import type { RevenueSnapshotRow } from "@/features/revenue-snapshots/helpers/revenue-snapshot.mapper";
import { toPublicRevenueSnapshot } from "@/features/revenue-snapshots/helpers/revenue-snapshot.mapper";
import { revenueSnapshotJson } from "@/features/revenue-snapshots/responses/revenue-snapshot.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Wraps a written revenue snapshot in the shared response shape.
 */
export function revenueSnapshotWriteResponse(
  snapshot: RevenueSnapshotRow,
  code:
    | typeof REVENUE_SNAPSHOT_CODES.SNAPSHOT_CREATED
    | typeof REVENUE_SNAPSHOT_CODES.SNAPSHOT_UPDATED,
) {
  const created = code === REVENUE_SNAPSHOT_CODES.SNAPSHOT_CREATED;
  return revenueSnapshotJson({
    code,
    data: { snapshot: toPublicRevenueSnapshot(snapshot) },
    message: created
      ? REVENUE_SNAPSHOT_MESSAGES.SNAPSHOT_CREATED
      : REVENUE_SNAPSHOT_MESSAGES.SNAPSHOT_UPDATED,
    status: created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK,
    success: true,
  });
}
