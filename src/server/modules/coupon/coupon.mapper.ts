import "server-only";

import type { DiscountType } from "@/generated/prisma/client";

import type { AdminCouponView, PublicCouponView } from "./coupon.types";

/** Helper for converting Prisma Decimal | number | null to plain number. */
function num(
  value: { toNumber(): number } | number | null | undefined,
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

/** Same helper, but preserves null instead of collapsing to 0. */
function numOrNull(
  value: { toNumber(): number } | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  return value.toNumber();
}

interface AdminCouponRow {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: { toNumber(): number } | number;
  minOrderAmount: { toNumber(): number } | number | null;
  maxDiscount: { toNumber(): number } | number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  salonId: string | null;
  createdAt: Date;
}

interface PublicCouponRow {
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: { toNumber(): number } | number;
  minOrderAmount: { toNumber(): number } | number | null;
  maxDiscount: { toNumber(): number } | number | null;
  validUntil: Date;
  isActive: boolean;
}

/**
 * Converts a Prisma coupon row into the admin view.
 *
 * Why:
 * Money fields come back as `Decimal` from Prisma. Normalizing here keeps
 * the JSON response shape stable across driver versions and lets every
 * consumer treat the fields as plain numbers.
 */
export function toAdminCouponView(row: AdminCouponRow): AdminCouponView {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discountType,
    discountValue: num(row.discountValue),
    minOrderAmount: numOrNull(row.minOrderAmount),
    maxDiscount: numOrNull(row.maxDiscount),
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    perUserLimit: row.perUserLimit,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    isActive: row.isActive,
    salonId: row.salonId,
    createdAt: row.createdAt,
  };
}

/** Converts a Prisma coupon row into the public snapshot. */
export function toPublicCouponView(row: PublicCouponRow): PublicCouponView {
  return {
    code: row.code,
    description: row.description,
    discountType: row.discountType,
    discountValue: num(row.discountValue),
    minOrderAmount: numOrNull(row.minOrderAmount),
    maxDiscount: numOrNull(row.maxDiscount),
    validUntil: row.validUntil,
    isActive: row.isActive,
  };
}
