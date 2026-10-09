import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { CouponManager } from "@/features/coupon/coupon-manager";
import type { CouponView } from "@/features/coupon/types";
import { getSession } from "@/lib/auth/get-session";
import { listSalonCoupons } from "@/server/modules/coupon/coupon.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Manage coupons | Nikharta Roop",
  description:
    "Create and manage discount coupons for your salon — percentage off, flat off, validity windows, and usage limits.",
};

/**
 * Server-side manage page for salon coupons.
 *
 * The list is fetched here (Server Component) and handed to the client
 * `CouponManager`, which owns the create/edit dialog state. Mutations run
 * client-side through `features/coupon/api.ts`; after each one the manager
 * calls `router.refresh()` so this page re-renders with fresh data.
 */
export default async function ManageCouponsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonCouponsManage(slug))}`,
    );
  }

  let salonName = "";
  let coupons: CouponView[] = [];
  try {
    const [salon, list] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      listSalonCoupons(user.id, slug, { limit: 100 }),
    ]);
    salonName = salon.name;
    // `list.items` carries `Date` objects server-side; the client `CouponView`
    // types them as ISO strings (the wire shape). Normalize here so the props
    // match what the client API would return — every consumer downstream
    // (table, form) treats these as strings.
    coupons = list.items.map((coupon) => ({
      ...coupon,
      validFrom: new Date(coupon.validFrom).toISOString(),
      validUntil: new Date(coupon.validUntil).toISOString(),
      createdAt: new Date(coupon.createdAt).toISOString(),
    }));
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <CouponManager
        salonSlug={slug}
        salonName={salonName}
        coupons={coupons}
      />
    </main>
  );
}
