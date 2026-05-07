import type { ZodType } from "zod";

import {
  REVENUE_SNAPSHOT_CODES,
  REVENUE_SNAPSHOT_MESSAGES,
} from "@/features/revenue-snapshots/constants/revenue-snapshot.constants";
import type { RevenueSnapshotRow } from "@/features/revenue-snapshots/helpers/revenue-snapshot.mapper";
import { toPublicRevenueSnapshot } from "@/features/revenue-snapshots/helpers/revenue-snapshot.mapper";
import {
  revenueSnapshotError,
  revenueSnapshotJson,
} from "@/features/revenue-snapshots/responses/revenue-snapshot.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses revenue snapshot query strings with feature-owned validation errors.
 */
export function parseRevenueSnapshotQuery<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (parsed.success) return { data: parsed.data, success: true as const };
  return {
    error: revenueSnapshotError({
      code: REVENUE_SNAPSHOT_CODES.VALIDATION_ERROR,
      message: REVENUE_SNAPSHOT_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a revenue snapshot collection in the shared response shape.
 */
export function revenueSnapshotListResponse(
  snapshots: RevenueSnapshotRow[],
  limit: number,
) {
  return revenueSnapshotJson({
    code: REVENUE_SNAPSHOT_CODES.SNAPSHOT_LISTED,
    data: { snapshots: snapshots.map(toPublicRevenueSnapshot), limit },
    message: REVENUE_SNAPSHOT_MESSAGES.SNAPSHOT_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
