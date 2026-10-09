import type { Metadata } from "next";

import { CouponManager } from "@/features/coupon";
import type { CouponView } from "@/features/coupon";
import { getSession } from "@/lib/auth/get-session";
import { listAdminCoupons } from "@/server/modules/coupon/coupon.service";

export const metadata: Metadata = {
  title: "Coupons | Admin",
  description: "Platform-wide coupon management — create, edit, and pause any coupon.",
  robots: { index: false, follow: false },
};

/**
 * Admin coupon management page.
 *
 * Why reuse the salon `CouponManager`:
 * The form, table, and dialog UX are identical for salon-scoped and
 * platform-wide coupons — only the API endpoint differs. Passing `admin`
 * flips every internal call to the `/admin/coupons` surface, so the same
 * client component serves both surfaces without forking the UI.
 */
export default async function AdminCouponsPage() {
  const user = await getSession();
  if (!user || user.role !== "SUPER_ADMIN") return null;

  const result = await listAdminCoupons(user.role, { limit: 100 });

  // Server `AdminCouponView` carries `Date` fields; the client `CouponView`
  // types them as ISO strings. Convert at the RSC boundary so types align.
  const coupons: CouponView[] = result.items.map((c) => ({
    ...c,
    validFrom: c.validFrom.toISOString(),
    validUntil: c.validUntil.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <CouponManager admin coupons={coupons} />
    </div>
  );
}
