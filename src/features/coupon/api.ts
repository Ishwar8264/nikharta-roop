import { api } from "@/lib/api/backend.client";

export type DiscountType = "PERCENTAGE" | "FLAT";

/** Mirrors `AdminCouponView` (dates serialize to strings over JSON). */
export interface CouponView {
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
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  salonId: string | null;
  createdAt: string;
}

/** Mirrors `CreateCouponInput`. */
export interface CreateCouponBody {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
}

/** Mirrors `UpdateCouponInput`. */
export interface UpdateCouponBody {
  description?: string | null;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

/** Lists the salon's own coupons. MANAGER+. */
export function listSalonCouponsApi(salonRef: string, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get<{
    message: string;
    data: CouponView[];
    meta: { nextCursor: string | null; hasMore: boolean };
  }>(`/salons/${encodeURIComponent(salonRef)}/coupons${query}`);
}

/** Creates a salon-scoped coupon. MANAGER+. */
export function createCouponApi(salonRef: string, body: CreateCouponBody) {
  return api.post<{ message: string; data: { coupon: CouponView } }>(
    `/salons/${encodeURIComponent(salonRef)}/coupons`,
    body,
  );
}

/** Updates one of the salon's coupons. MANAGER+. */
export function updateCouponApi(
  salonRef: string,
  couponId: string,
  body: UpdateCouponBody,
) {
  return api.patch<{ message: string; data: { coupon: CouponView } }>(
    `/salons/${encodeURIComponent(salonRef)}/coupons/${encodeURIComponent(couponId)}`,
    body,
  );
}

/** Deactivates (soft) one of the salon's coupons. MANAGER+. */
export function deactivateCouponApi(salonRef: string, couponId: string) {
  return api.delete<{ message: string; data: { coupon: CouponView } }>(
    `/salons/${encodeURIComponent(salonRef)}/coupons/${encodeURIComponent(couponId)}`,
  );
}
