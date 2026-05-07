import type { Prisma, UserRole } from "@prisma/client";

export type AdminUserRow = {
  avatarUrl: string | null;
  branch: Record<string, unknown> | null;
  branchId: string | null;
  createdAt: Date;
  email: string | null;
  id: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  loyaltyPoints: number;
  mobile: string;
  mobileVerifiedAt: Date | null;
  name: string | null;
  notificationPreferences: Prisma.JsonValue;
  profileCompletedAt: Date | null;
  role: UserRole;
  updatedAt: Date;
};

/**
 * Normalizes one admin user row for API responses.
 */
export function toPublicAdminUser(user: AdminUserRow) {
  return user;
}
