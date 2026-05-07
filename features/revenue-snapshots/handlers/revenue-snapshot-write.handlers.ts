import { getDb } from "@/db";
import {
  REVENUE_SNAPSHOT_CODES,
  REVENUE_SNAPSHOT_MESSAGES,
} from "@/features/revenue-snapshots/constants/revenue-snapshot.constants";
import { revenueSnapshotSelect } from "@/features/revenue-snapshots/helpers/revenue-snapshot.selectors";
import {
  createRevenueSnapshotSchema,
  updateRevenueSnapshotSchema,
  type CreateRevenueSnapshotInput,
  type UpdateRevenueSnapshotInput,
} from "@/schema/revenue-snapshots/schema.revenue-snapshot";
import { handleRevenueSnapshotError, throwRevenueSnapshotNotFound } from "./revenue-snapshot.errors";
import {
  assertCanManageRevenueSnapshotBranch,
  assertRevenueSnapshotBranch,
  loadManageableRevenueSnapshot,
} from "./revenue-snapshot.guards";
import {
  parseRevenueSnapshotBody,
  requireRevenueSnapshotAdmin,
  type RevenueSnapshotAdminUser,
} from "./revenue-snapshot.shared";
import {
  createRevenueSnapshotData,
  updateRevenueSnapshotData,
} from "./revenue-snapshot-write.helpers";
import { revenueSnapshotWriteResponse } from "./revenue-snapshot-write.responses";

/**
 * Handles admin revenue snapshot creation requests.
 */
export async function handleCreateRevenueSnapshot(request: Request) {
  const auth = await requireRevenueSnapshotAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseRevenueSnapshotBody(request, createRevenueSnapshotSchema);
  if (body.error) return body.error;
  return createRevenueSnapshot(body.data, auth.session.user);
}

/**
 * Handles admin revenue snapshot patch requests.
 */
export async function handleUpdateRevenueSnapshot(request: Request, snapshotId: string) {
  const auth = await requireRevenueSnapshotAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseRevenueSnapshotBody(request, updateRevenueSnapshotSchema);
  if (body.error) return body.error;
  return updateRevenueSnapshot(snapshotId, body.data, auth.session.user);
}

/**
 * Creates one daily revenue snapshot after branch validation.
 */
async function createRevenueSnapshot(
  input: CreateRevenueSnapshotInput,
  admin: RevenueSnapshotAdminUser,
) {
  try {
    assertCanManageRevenueSnapshotBranch(admin, input.branchId);
    await assertRevenueSnapshotBranch(input.branchId);
    const snapshot = await getDb().revenueSnapshot.create({
      data: createRevenueSnapshotData(input),
      select: revenueSnapshotSelect(),
    });
    return revenueSnapshotWriteResponse(snapshot, REVENUE_SNAPSHOT_CODES.SNAPSHOT_CREATED);
  } catch (error) {
    return handleRevenueSnapshotError(error, {
      code: REVENUE_SNAPSHOT_CODES.SNAPSHOT_CREATE_FAILED,
      handler: "createRevenueSnapshot",
      message: REVENUE_SNAPSHOT_MESSAGES.SNAPSHOT_CREATE_FAILED,
    });
  }
}

/**
 * Updates one revenue snapshot while preserving branch ownership.
 */
async function updateRevenueSnapshot(
  snapshotId: string,
  input: UpdateRevenueSnapshotInput,
  admin: RevenueSnapshotAdminUser,
) {
  try {
    const current = await loadManageableRevenueSnapshot(snapshotId, admin);
    if (!current) throwRevenueSnapshotNotFound();
    const snapshot = await getDb().revenueSnapshot.update({
      data: updateRevenueSnapshotData(input),
      select: revenueSnapshotSelect(),
      where: { id: snapshotId },
    });
    return revenueSnapshotWriteResponse(snapshot, REVENUE_SNAPSHOT_CODES.SNAPSHOT_UPDATED);
  } catch (error) {
    return handleRevenueSnapshotError(error, {
      code: REVENUE_SNAPSHOT_CODES.SNAPSHOT_UPDATE_FAILED,
      handler: "updateRevenueSnapshot",
      message: REVENUE_SNAPSHOT_MESSAGES.SNAPSHOT_UPDATE_FAILED,
    });
  }
}
