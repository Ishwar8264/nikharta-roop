/**
 * Purpose: Public portfolio gallery for published salon work.
 * Responsibilities: render branch filters and customer-facing portfolio cards.
 * Important notes: filtering is server-driven through links so the gallery stays shareable.
 */
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PortfolioCard } from "@/features/portfolio/components/portfolio-card";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import type { PublicPortfolioItem } from "@/features/portfolio/types/portfolio.types";

type PortfolioGalleryProps = {
  branches: PublicBranch[];
  items: PublicPortfolioItem[];
  selectedBranchId?: string;
};

/**
 * Renders published portfolio cards with branch quick filters.
 */
export function PortfolioGallery({
  branches,
  items,
  selectedBranchId,
}: PortfolioGalleryProps) {
  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button asChild size="sm" variant={!selectedBranchId ? "default" : "outline"}>
          <Link href="/portfolio">All branches</Link>
        </Button>
        {branches.map((branch) => (
          <Button
            asChild
            key={branch.id}
            size="sm"
            variant={selectedBranchId === branch.id ? "default" : "outline"}
          >
            <Link href={`/portfolio?branchId=${branch.id}`}>
              {branch.nameHi}, {branch.city}
            </Link>
          </Button>
        ))}
      </div>

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <PortfolioCard
              branch={formatBranchName(item.branch)}
              description={item.descriptionHi}
              imageUrls={getPortfolioImages(item)}
              isFeatured={item.isFeatured}
              key={item.id}
              title={item.titleHi}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-white p-6 text-sm text-muted-foreground">
          Portfolio work is not published for this branch yet.
        </div>
      )}
    </div>
  );
}

/**
 * Builds the public image fallback chain from gallery and before/after media.
 */
function getPortfolioImages(item: PublicPortfolioItem) {
  return [
    ...item.imageUrls,
    item.afterImageUrl,
    item.beforeImageUrl,
  ].filter((imageUrl): imageUrl is string => Boolean(imageUrl));
}

/**
 * Formats compact branch relation data for gallery cards.
 */
function formatBranchName(branch: PublicPortfolioItem["branch"]) {
  if (!branch) return undefined;

  const nameHi = readString(branch, "nameHi");
  const city = readString(branch, "city");

  return [nameHi, city].filter(Boolean).join(", ") || undefined;
}

/**
 * Reads relation labels defensively because API relations are intentionally compact.
 */
function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" && value.length > 0 ? value : null;
}
