/**
 * Purpose: Public offer catalog UI for branch-aware coupon discovery.
 * Responsibilities: render branch filters and active offer cards.
 * Important notes: global offers appear together with selected-branch offers.
 */
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { OfferCard } from "@/features/offers/components/offer-card";
import type { PublicOffer } from "@/features/offers/types/offer.types";

type OfferCatalogProps = {
  branches: PublicBranch[];
  offers: PublicOffer[];
  selectedBranchId?: string;
};

/**
 * Renders public branch tabs and active offer cards.
 */
export function OfferCatalog({
  branches,
  offers,
  selectedBranchId,
}: OfferCatalogProps) {
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {branches.map((branch) => (
            <Button
              asChild
              key={branch.id}
              size="sm"
              variant={branch.id === selectedBranchId ? "default" : "outline"}
            >
              <Link href={`/offers?branchId=${branch.id}`}>{branch.nameHi}</Link>
            </Button>
          ))}
        </div>
        {selectedBranch ? (
          <p className="text-sm text-muted-foreground">
            Showing offers for {selectedBranch.nameHi}, {selectedBranch.city}.
          </p>
        ) : null}
      </section>

      {offers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <OfferCard
              branch={offer.branch ? offer.branch.nameHi : null}
              code={offer.code}
              description={offer.descriptionHi}
              discountType={offer.discountType}
              discountValue={offer.discountValue}
              key={offer.id}
              minOrder={offer.minOrder}
              services={offer.services.map((item) => item.service.nameHi)}
              titleEn={offer.titleEn}
              titleHi={offer.titleHi}
              validUntil={offer.validUntil}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-stone-300 bg-white p-6 text-sm text-muted-foreground">
          No active offers are available right now.
        </div>
      )}
    </div>
  );
}
