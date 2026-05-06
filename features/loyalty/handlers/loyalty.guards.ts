import type { LoyaltyTransactionType } from "@prisma/client";

import { getDb } from "@/db";
import { LOYALTY_CODES, LOYALTY_MESSAGES } from "@/features/loyalty/constants/loyalty.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { LoyaltyVisibleError, type LoyaltyAdminUser } from "./loyalty.shared";

/**
 * Resolves the branch scope allowed for admin loyalty list requests.
 */
export function resolveLoyaltyBranchScope(
  requestedBranchId: string | undefined,
  admin: LoyaltyAdminUser,
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throwForbidden();
}

/**
 * Loads a customer and verifies the admin can manage their loyalty balance.
 */
export async function loadManageableLoyaltyUser(userId: string, admin: LoyaltyAdminUser) {
  const user = await getDb().user.findUnique({
    select: {
      branchId: true,
      id: true,
      isActive: true,
      loyaltyPoints: true,
      mobile: true,
      name: true,
    },
    where: { id: userId },
  });
  if (!user || !user.isActive) throwUserNotFound();
  if (admin.role === "SUPER_ADMIN" || (user.branchId && admin.branchId === user.branchId)) {
    return user;
  }
  throwForbidden();
}

/**
 * Verifies optional booking linkage belongs to the same customer and branch scope.
 */
export async function assertLoyaltyBookingScope(
  bookingId: string | undefined,
  userId: string,
  admin: LoyaltyAdminUser,
) {
  if (!bookingId) return;
  const booking = await getDb().booking.findUnique({
    select: { branchId: true, id: true, userId: true },
    where: { id: bookingId },
  });
  if (!booking || booking.userId !== userId) throwForbidden();
  if (admin.role === "SUPER_ADMIN" || admin.branchId === booking.branchId) return;
  throwForbidden();
}

/**
 * Converts positive input points into the signed ledger delta.
 */
export function signedLoyaltyPoints(type: LoyaltyTransactionType, points: number) {
  return type === "REDEEMED" || type === "DEDUCTED" ? -points : points;
}

/**
 * Throws when a balance update could not satisfy the points guard.
 */
export function throwInsufficientLoyaltyPoints(): never {
  throw new LoyaltyVisibleError(
    LOYALTY_CODES.INSUFFICIENT_POINTS,
    LOYALTY_MESSAGES.INSUFFICIENT_POINTS,
    HTTP_STATUS.CONFLICT,
  );
}

/**
 * Throws a loyalty user not-found error without importing response helpers.
 */
function throwUserNotFound(): never {
  throw new LoyaltyVisibleError(
    LOYALTY_CODES.USER_NOT_FOUND,
    LOYALTY_MESSAGES.USER_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}

/**
 * Throws a branch-scope authorization error.
 */
function throwForbidden(): never {
  throw new LoyaltyVisibleError(
    LOYALTY_CODES.FORBIDDEN,
    LOYALTY_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
