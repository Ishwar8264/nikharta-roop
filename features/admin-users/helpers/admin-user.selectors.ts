import type { Prisma } from "@prisma/client";

/**
 * Selects user fields exposed by admin customer APIs.
 */
export const adminUserSelect = () =>
  ({
    avatarUrl: true,
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    createdAt: true,
    email: true,
    id: true,
    isActive: true,
    lastLoginAt: true,
    loyaltyPoints: true,
    mobile: true,
    mobileVerifiedAt: true,
    name: true,
    notificationPreferences: true,
    profileCompletedAt: true,
    role: true,
    updatedAt: true,
  }) satisfies Prisma.UserSelect;
