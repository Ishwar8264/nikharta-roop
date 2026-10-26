/**
 * Browser-safe types for the coupon feature.
 *
 * Why re-export from `./api`:
 * The API module already owns the wire shapes (`CouponView`, `CreateCouponBody`,
 * `UpdateCouponBody`, `DiscountType`) — duplicating them here would let the
 * copies drift. Consumers import everything from one place via the feature
 * barrel, and Client Components never reach into `src/server/**`.
 */
export type {
  CouponView,
  CreateCouponBody,
  DiscountType,
  UpdateCouponBody,
} from "./api";

/** Props shared by every entry point that renders the salon coupon list. */
export interface SalonCouponsProps {
  salonSlug: string;
  salonName: string;
  coupons: import("./api").CouponView[];
}
