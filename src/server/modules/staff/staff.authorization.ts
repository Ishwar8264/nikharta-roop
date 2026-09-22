import "server-only";

import type { SalonMemberRole } from "@/generated/prisma/client";
import { hasRoleAtLeast } from "@/server/modules/salon/salon.authorization";

import { StaffRoleInsufficientError } from "./staff.errors";
import type { StaffViewerContext } from "./staff.types";

/**
 * Requires the caller to be at least the given role *or* the target staff.
 *
 * Why:
 * Schedule, leaves, and skills are visible to managers and to the staff
 * member who owns them. Enforcing the union here keeps every sub-resource
 * route consistent — and prevents accidentally letting staff read a
 * colleague's data because a check was forgotten.
 */
export function assertManagerOrSelf(
  context: StaffViewerContext,
  minimum: SalonMemberRole,
): void {
  if (context.isSelf) return;
  if (!hasRoleAtLeast(context.callerRole, minimum)) {
    throw new StaffRoleInsufficientError();
  }
}
