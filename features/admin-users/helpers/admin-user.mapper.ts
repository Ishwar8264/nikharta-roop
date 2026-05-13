import type { Prisma } from "@prisma/client";

import { adminUserSelect } from "./admin-user.selectors";

export type AdminUserRow = Prisma.UserGetPayload<{
  select: ReturnType<typeof adminUserSelect>;
}>;

/**
 * Normalizes one admin user row for API responses.
 */
export function toPublicAdminUser(user: AdminUserRow) {
  return user;
}
