import { getDb } from "@/db";
import {
  ADMIN_USER_CODES,
  ADMIN_USER_MESSAGES,
} from "@/features/admin-users/constants/admin-user.constants";
import { adminUserSelect } from "@/features/admin-users/helpers/admin-user.selectors";
import {
  suspendAdminUserSchema,
  updateAdminUserSchema,
  type SuspendAdminUserInput,
  type UpdateAdminUserInput,
} from "@/schema/admin-users/schema.admin-user";
import { handleAdminUserError, throwAdminUserNotFound } from "./admin-user.errors";
import {
  assertAdminUserBranch,
  assertCanManageAdminUser,
} from "./admin-user.guards";
import {
  parseAdminUserBody,
  requireAdminUserActor,
  type AdminUserActor,
} from "./admin-user.shared";
import { adminUserWriteResponse } from "./admin-user-write.responses";

/**
 * Handles admin user patch requests.
 */
export async function handleUpdateAdminUser(request: Request, userId: string) {
  const auth = await requireAdminUserActor(request);
  if (!auth.success) return auth.error;
  const body = await parseAdminUserBody(request, updateAdminUserSchema);
  if (body.error) return body.error;
  return updateAdminUser(userId, body.data, auth.session.user);
}

/**
 * Handles admin user suspend/reactivate requests.
 */
export async function handleSuspendAdminUser(request: Request, userId: string) {
  const auth = await requireAdminUserActor(request);
  if (!auth.success) return auth.error;
  const body = await parseAdminUserBody(request, suspendAdminUserSchema);
  if (body.error) return body.error;
  return suspendAdminUser(userId, body.data, auth.session.user);
}

/**
 * Updates editable admin-owned user fields after scope validation.
 */
async function updateAdminUser(
  userId: string,
  input: UpdateAdminUserInput,
  admin: AdminUserActor,
) {
  try {
    const current = await getDb().user.findUnique({
      select: { branchId: true, id: true },
      where: { id: userId },
    });
    if (!current) throwAdminUserNotFound();
    assertCanManageAdminUser(admin, current.branchId);
    if (input.role && admin.role !== "SUPER_ADMIN") {
      assertCanManageAdminUser(admin, null);
    }
    if (input.branchId) await assertAdminUserBranch(input.branchId);
    if (Object.prototype.hasOwnProperty.call(input, "branchId")) {
      assertCanManageAdminUser(admin, input.branchId ?? null);
    } else {
      assertCanManageAdminUser(admin, current.branchId);
    }
    const user = await getDb().user.update({
      data: input,
      select: adminUserSelect(),
      where: { id: userId },
    });
    return adminUserWriteResponse(user);
  } catch (error) {
    return handleAdminUserError(error, {
      code: ADMIN_USER_CODES.USER_UPDATE_FAILED,
      handler: "updateAdminUser",
      message: ADMIN_USER_MESSAGES.USER_UPDATE_FAILED,
    });
  }
}

/**
 * Suspends or reactivates one manageable user.
 */
async function suspendAdminUser(
  userId: string,
  input: SuspendAdminUserInput,
  admin: AdminUserActor,
) {
  return updateAdminUser(userId, { isActive: input.isActive }, admin);
}
