/**
 * Purpose: Admin Offers route for coupon and promotion management.
 * Responsibilities: load protected offer data and render branch/global offer overview.
 * Important notes: create flow supports service restrictions for targeted promotions.
 */
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminOfferList } from "@/features/offers/components/admin-offer-list";
import { listAdminOffers } from "@/features/offers/queries/offer.query";

/**
 * Renders the admin offer management overview.
 */
export default async function AdminOffersPage() {
  const { error, offers } = await listAdminOffers({
    limit: 100,
    status: "all",
  });

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-700">Offers</p>
          <h1 className="font-heading text-2xl font-semibold">
            Offer management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review active and inactive offers, coupon codes, limits, validity,
            and service restrictions.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/offers/new">Create offer</Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <AdminOfferList offers={offers} />
    </section>
  );
}
