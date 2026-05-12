import { z } from "zod";

import {
  ADMIN_USER_CODES,
  ADMIN_USER_MESSAGES,
} from "@/features/admin-users/constants/admin-user.constants";
import type { AdminUserRow } from "@/features/admin-users/helpers/admin-user.mapper";
import { toPublicAdminUser } from "@/features/admin-users/helpers/admin-user.mapper";
import {
  adminUserError,
  adminUserJson,
} from "@/features/admin-users/responses/admin-user.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses admin user query strings with feature-owned validation errors.
 */
export function parseAdminUserQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: adminUserError({
      code: ADMIN_USER_CODES.VALIDATION_ERROR,
      message: ADMIN_USER_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps an admin user collection in the shared response shape.
 */
export function adminUserListResponse(users: AdminUserRow[], limit: number) {
  return adminUserJson({
    code: ADMIN_USER_CODES.USER_LISTED,
    data: { users: users.map(toPublicAdminUser), limit },
    message: ADMIN_USER_MESSAGES.USER_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
