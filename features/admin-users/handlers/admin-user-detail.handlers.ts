import { getDb } from "@/db";
import {
  ADMIN_USER_CODES,
  ADMIN_USER_MESSAGES,
} from "@/features/admin-users/constants/admin-user.constants";
import { toPublicAdminUser } from "@/features/admin-users/helpers/admin-user.mapper";
import { adminUserSelect } from "@/features/admin-users/helpers/admin-user.selectors";
import { adminUserJson } from "@/features/admin-users/responses/admin-user.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { handleAdminUserError, throwAdminUserNotFound } from "./admin-user.errors";
import { assertCanManageAdminUser } from "./admin-user.guards";
import { requireAdminUserActor } from "./admin-user.shared";

/**
 * Handles admin user detail requests.
 */
export async function handleGetAdminUser(request: Request, userId: string) {
  const auth = await requireAdminUserActor(request);
  if (!auth.success) return auth.error;
  try {
    const user = await getDb().user.findUnique({
      select: adminUserSelect(),
      where: { id: userId },
    });
    if (!user) throwAdminUserNotFound();
    assertCanManageAdminUser(auth.session.user, user.branchId);
    return adminUserJson({
      code: ADMIN_USER_CODES.USER_LOADED,
      data: { user: toPublicAdminUser(user) },
      message: ADMIN_USER_MESSAGES.USER_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleAdminUserError(error, {
      code: ADMIN_USER_CODES.USER_LOAD_FAILED,
      handler: "handleGetAdminUser",
      message: ADMIN_USER_MESSAGES.USER_LOAD_FAILED,
    });
  }
}
