/**
 * Purpose: Public Offers route for customer coupon discovery.
 * Responsibilities: choose a branch, load active offers, and render offer catalog UI.
 * Important notes: branch-specific and global offers are both returned by the public offer API.
 */
import type { Metadata } from "next";

import { listPublicBranches } from "@/features/branches/queries/branch.query";
import { OfferCatalog } from "@/features/offers/components/offer-catalog";
import { listPublicOffers } from "@/features/offers/queries/offer.query";

type OffersPageProps = {
  searchParams: Promise<{ branchId?: string }>;
};

export const metadata: Metadata = {
  title: "Offers | Nikharta Roop",
  description:
    "Browse active Nikharta Roop beauty offers, coupon codes, discounts, and validity.",
};

/**
 * Loads and renders public offers for the selected branch.
 */
export default async function OffersPage({ searchParams }: OffersPageProps) {
  const [{ branchId }, { branches, error: branchError }] = await Promise.all([
    searchParams,
    listPublicBranches(),
  ]);
  const selectedBranchId = resolveSelectedBranchId(branchId, branches);
  const offerResult = await listPublicOffers({
    branchId: selectedBranchId,
    limit: 50,
  });

  return (
    <main className="bg-[#fffaf6]">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-medium text-rose-700">Offers</p>
          <h1 className="font-heading text-3xl font-semibold">
            Explore active beauty offers
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse current coupon codes, discounts, validity, and service
            restrictions.
          </p>
        </div>

        <ErrorText messages={[branchError, offerResult.error]} />
        <OfferCatalog
          branches={branches}
          offers={offerResult.offers}
          selectedBranchId={selectedBranchId}
        />
      </section>
    </main>
  );
}

/**
 * Picks the requested branch when valid, otherwise falls back to the first active branch.
 */
function resolveSelectedBranchId(
  requestedBranchId: string | undefined,
  branches: Array<{ id: string }>,
) {
  if (requestedBranchId && branches.some((branch) => branch.id === requestedBranchId)) {
    return requestedBranchId;
  }

  return branches[0]?.id;
}

/**
 * Renders API load errors without blocking partial catalog data.
 */
function ErrorText({ messages }: { messages: Array<string | null> }) {
  const visibleMessages = messages.filter(Boolean);

  if (visibleMessages.length === 0) return null;

  return (
    <div className="mb-4 space-y-1 text-sm text-destructive">
      {visibleMessages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
