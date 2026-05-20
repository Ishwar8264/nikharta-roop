/**
 * Purpose: Admin offer overview list.
 * Responsibilities: render offer cards with branch scope, status, discounts, dates, and service restrictions.
 * Important notes: empty state explains when no offers exist in the current admin scope.
 */
import { OfferCard } from "@/features/offers/components/offer-card";
import type { PublicOffer } from "@/features/offers/types/offer.types";

type AdminOfferListProps = {
  offers: PublicOffer[];
};

/**
 * Renders offers visible to the authenticated admin.
 */
export function AdminOfferList({ offers }: AdminOfferListProps) {
  if (offers.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-stone-300 bg-white p-6 text-sm text-muted-foreground">
        No offers are available for your admin scope yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {offers.map((offer) => (
        <OfferCard
          branch={offer.branch ? `${offer.branch.nameHi}, ${offer.branch.city}` : null}
          code={offer.code}
          description={offer.descriptionHi}
          discountType={offer.discountType}
          discountValue={offer.discountValue}
          isActive={offer.isActive}
          key={offer.id}
          minOrder={offer.minOrder}
          services={offer.services.map((item) => item.service.nameHi)}
          titleEn={offer.titleEn}
          titleHi={offer.titleHi}
          validUntil={offer.validUntil}
        />
      ))}
    </div>
  );
}
