/**
 * Purpose: Public portfolio gallery route.
 * Responsibilities: load published salon work and expose branch-filtered gallery views.
 * Important notes: search params are server-handled so filtered gallery URLs are shareable.
 */
import type { Metadata } from "next";

import { listPublicBranches } from "@/features/branches/queries/branch.query";
import { PortfolioGallery } from "@/features/portfolio/components/portfolio-gallery";
import { listPublicPortfolio } from "@/features/portfolio/queries/portfolio.query";

export const metadata: Metadata = {
  title: "Portfolio | Nikharta Roop",
  description:
    "Explore Nikharta Roop beauty transformations and salon portfolio updates soon.",
};

/**
 * Renders the public portfolio gallery.
 */
export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const { branchId } = await searchParams;
  const [{ branches, error: branchError }, { error: portfolioError, items }] =
    await Promise.all([
      listPublicBranches(),
      listPublicPortfolio({ branchId, limit: 50 }),
    ]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-medium text-rose-700">Portfolio</p>
        <h1 className="font-heading text-3xl font-semibold">
          Beauty transformations
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Explore published work from Nikharta Roop branches.
        </p>
      </div>

      {branchError ? <p className="text-sm text-destructive">{branchError}</p> : null}
      {portfolioError ? <p className="text-sm text-destructive">{portfolioError}</p> : null}
      <PortfolioGallery
        branches={branches}
        items={items}
        selectedBranchId={branchId}
      />
    </section>
  );
}
