import {
  ADMIN_USER_CODES,
  ADMIN_USER_MESSAGES,
} from "@/features/admin-users/constants/admin-user.constants";
import { adminUserError } from "@/features/admin-users/responses/admin-user.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { AdminUserVisibleError } from "./admin-user.shared";

/**
 * Converts expected and unexpected admin user failures into safe responses.
 */
export function handleAdminUserError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof AdminUserVisibleError) {
    return adminUserError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return adminUserError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws an admin user not-found error.
 */
export function throwAdminUserNotFound(): never {
  throw new AdminUserVisibleError(
    ADMIN_USER_CODES.USER_NOT_FOUND,
    ADMIN_USER_MESSAGES.USER_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
