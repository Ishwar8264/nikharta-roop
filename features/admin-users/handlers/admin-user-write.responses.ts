import {
  ADMIN_USER_CODES,
  ADMIN_USER_MESSAGES,
} from "@/features/admin-users/constants/admin-user.constants";
import type { AdminUserRow } from "@/features/admin-users/helpers/admin-user.mapper";
import { toPublicAdminUser } from "@/features/admin-users/helpers/admin-user.mapper";
import { adminUserJson } from "@/features/admin-users/responses/admin-user.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Wraps an updated admin user in the shared response shape.
 */
export function adminUserWriteResponse(user: AdminUserRow) {
  return adminUserJson({
    code: ADMIN_USER_CODES.USER_UPDATED,
    data: { user: toPublicAdminUser(user) },
    message: ADMIN_USER_MESSAGES.USER_UPDATED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
