import "server-only";

import type { SalonMemberRole } from "@/generated/prisma/client";

import {
  SalonAccessDeniedError,
  SalonRoleInsufficientError,
} from "./salon.errors";

/**
 * Numeric ranking for salon roles.
 *
 * Why:
 * Most checks are "at least this role". A rank map keeps the comparison in
 * one place instead of duplicating `role === "OWNER" || role === "MANAGER"`
 * across every handler.
 */
const ROLE_RANK: Record<SalonMemberRole, number> = {
  OWNER: 3,
  MANAGER: 2,
  STAFF: 1,
};

/** Returns true when `actual` is at least as privileged as `required`. */
export function hasRoleAtLeast(
  actual: SalonMemberRole,
  required: SalonMemberRole,
): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

/**
 * Asserts the caller's role satisfies the required minimum.
 *
 * Why:
 * Throwing a typed error keeps the route's error mapping simple and prevents
 * accidentally returning 200 on an unhandled permission miss.
 */
export function assertRoleAtLeast(
  actual: SalonMemberRole,
  required: SalonMemberRole,
): void {
  if (!hasRoleAtLeast(actual, required)) {
    throw new SalonRoleInsufficientError();
  }
}

/**
 * Re-export of the access denied error for callers that only need to throw.
 *
 * Why:
 * Repository helpers return `null` when the caller has no membership. The
 * service layer turns that into a typed error, and exposing the class here
 * keeps the import graph shallow.
 */
export { SalonAccessDeniedError };
