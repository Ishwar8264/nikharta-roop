import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Columns safe to return on a staff-facing customer summary.
 *
 * Why:
 * A customer row carries sensitive fields (password, role, loyaltyPoints,
 * verification flags). This projection selects only the columns a staff UI
 * needs to label a customer-facing header. Keeping the projection in one
 * `as const` value lets every caller share the same select shape and prevents
 * a stray column from leaking in later.
 */
const PUBLIC_CUSTOMER_SUMMARY_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
} as const satisfies Prisma.UserSelect;

/**
 * Loads a single user's summary projection, excluding soft-deleted rows.
 *
 * Why `findUnique` + `deletedAt: null`:
 * `id` is the user's primary key, so `findUnique` is the cheapest lookup. We
 * still fold `deletedAt: null` into the `where` so a soft-deleted account
 * resolves to `null` for callers — they cannot distinguish "no such user"
 * from "deleted user" and that's intentional (defense in depth). We do not
 * wrap this in `try/catch`: Prisma errors are unexpected infrastructure
 * failures and should propagate to the caller (the server page already has
 * a top-level error boundary).
 */
export async function findUserSummaryById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: PUBLIC_CUSTOMER_SUMMARY_SELECT,
  });
}
