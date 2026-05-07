import { Prisma } from "@prisma/client";

import {
  REVENUE_SNAPSHOT_CODES,
  REVENUE_SNAPSHOT_MESSAGES,
} from "@/features/revenue-snapshots/constants/revenue-snapshot.constants";
import { revenueSnapshotError } from "@/features/revenue-snapshots/responses/revenue-snapshot.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { RevenueSnapshotVisibleError } from "./revenue-snapshot.shared";

/**
 * Converts expected and unexpected revenue snapshot failures into safe responses.
 */
export function handleRevenueSnapshotError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof RevenueSnapshotVisibleError) {
    return revenueSnapshotError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  if (isUniqueConstraintError(error)) {
    return revenueSnapshotError({
      code: REVENUE_SNAPSHOT_CODES.SNAPSHOT_DUPLICATE,
      message: REVENUE_SNAPSHOT_MESSAGES.SNAPSHOT_DUPLICATE,
      status: HTTP_STATUS.CONFLICT,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return revenueSnapshotError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws a revenue snapshot not-found error.
 */
export function throwRevenueSnapshotNotFound(): never {
  throw new RevenueSnapshotVisibleError(
    REVENUE_SNAPSHOT_CODES.SNAPSHOT_NOT_FOUND,
    REVENUE_SNAPSHOT_MESSAGES.SNAPSHOT_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Detects Prisma unique constraint failures for branch-date snapshots.
 */
function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}
