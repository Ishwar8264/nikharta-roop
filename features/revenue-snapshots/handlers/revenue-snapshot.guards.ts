import { getDb } from "@/db";
import {
  REVENUE_SNAPSHOT_CODES,
  REVENUE_SNAPSHOT_MESSAGES,
} from "@/features/revenue-snapshots/constants/revenue-snapshot.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  RevenueSnapshotVisibleError,
  type RevenueSnapshotAdminUser,
} from "./revenue-snapshot.shared";

/**
 * Resolves the branch scope allowed for admin revenue snapshot list requests.
 */
export async function resolveRevenueSnapshotBranch(
  requestedBranchId: string | undefined,
  admin: RevenueSnapshotAdminUser,
) {
  if (admin.role !== "SUPER_ADMIN") {
    if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
      return admin.branchId;
    }
    throwRevenueSnapshotForbidden();
  }
  if (!requestedBranchId) return undefined;
  await assertRevenueSnapshotBranch(requestedBranchId);
  return requestedBranchId;
}

/**
 * Ensures branch admins only manage their assigned branch.
 */
export function assertCanManageRevenueSnapshotBranch(
  admin: RevenueSnapshotAdminUser,
  branchId: string,
) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;
  throwRevenueSnapshotForbidden();
}

/**
 * Verifies the target branch exists before snapshot writes.
 */
export async function assertRevenueSnapshotBranch(branchId: string) {
  const branch = await getDb().branch.findUnique({
    select: { id: true },
    where: { id: branchId },
  });
  if (branch) return;
  throw new RevenueSnapshotVisibleError(
    REVENUE_SNAPSHOT_CODES.BRANCH_NOT_FOUND,
    REVENUE_SNAPSHOT_MESSAGES.BRANCH_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Loads one snapshot and validates branch ownership.
 */
export async function loadManageableRevenueSnapshot(
  snapshotId: string,
  admin: RevenueSnapshotAdminUser,
) {
  const snapshot = await getDb().revenueSnapshot.findUnique({
    select: { branchId: true, id: true },
    where: { id: snapshotId },
  });
  if (!snapshot) return null;
  await assertCanManageRevenueSnapshotBranch(admin, snapshot.branchId);
  return snapshot;
}

/**
 * Throws a branch-scope authorization error.
 */
function throwRevenueSnapshotForbidden(): never {
  throw new RevenueSnapshotVisibleError(
    REVENUE_SNAPSHOT_CODES.FORBIDDEN,
    REVENUE_SNAPSHOT_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
