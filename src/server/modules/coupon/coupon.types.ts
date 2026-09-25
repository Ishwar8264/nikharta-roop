import type { z } from "zod";

import type { DiscountType } from "@/generated/prisma/client";

import type {
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,
} from "./coupon.schema";

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ListCouponsQuery = z.infer<typeof listCouponsQuerySchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;

/**
 * Full coupon shape for the admin surface.
 *
 * Why:
 * `usedCount` and `isActive` are exposed so an admin can see the state of a
 * campaign without a second query. `discountValue`, `minOrderAmount`, and
 * `maxDiscount` are returned as plain numbers — Prisma's `Decimal` is
 * normalized in the mapper.
 */
export interface AdminCouponView {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
}

/** Public coupon snapshot for the code lookup endpoint. */
export interface PublicCouponView {
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  validUntil: Date;
  isActive: boolean;
}

export interface PaginatedAdminCoupons {
  items: AdminCouponView[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Result of a public validation.
 *
 * Why:
 * The client needs both the boolean outcome and the actual discount amount
 * to render the checkout summary. When the coupon is not applicable, the
 * `reason` field is populated so the UI can explain why without parsing
 * error messages.
 */
export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountAmount: number;
  finalTotal: number;
  reason?: string;
}
