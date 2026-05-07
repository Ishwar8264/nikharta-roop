import { getDb } from "@/db";
import {
  ADMIN_USER_CODES,
  ADMIN_USER_MESSAGES,
} from "@/features/admin-users/constants/admin-user.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { AdminUserVisibleError, type AdminUserActor } from "./admin-user.shared";

/**
 * Resolves branch scope allowed for admin user list requests.
 */
export async function resolveAdminUserBranch(
  requestedBranchId: string | undefined,
  admin: AdminUserActor,
) {
  if (admin.role !== "SUPER_ADMIN") {
    if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
      return admin.branchId;
    }
    throwAdminUserForbidden();
  }
  if (!requestedBranchId) return undefined;
  await assertAdminUserBranch(requestedBranchId);
  return requestedBranchId;
}

/**
 * Ensures admins can only manage users in their allowed branch scope.
 */
export function assertCanManageAdminUser(admin: AdminUserActor, branchId: string | null) {
  if (admin.role === "SUPER_ADMIN") return;
  if (admin.branchId && branchId === admin.branchId) return;
  throwAdminUserForbidden();
}

/**
 * Verifies a target branch exists when assigning users.
 */
export async function assertAdminUserBranch(branchId: string) {
  const branch = await getDb().branch.findUnique({
    select: { id: true },
    where: { id: branchId },
  });
  if (branch) return;
  throw new AdminUserVisibleError(
    ADMIN_USER_CODES.BRANCH_NOT_FOUND,
    ADMIN_USER_MESSAGES.BRANCH_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Throws a branch-scope authorization error.
 */
function throwAdminUserForbidden(): never {
  throw new AdminUserVisibleError(
    ADMIN_USER_CODES.FORBIDDEN,
    ADMIN_USER_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
