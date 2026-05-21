/**
 * Purpose: Public package catalog UI for branch-aware package discovery.
 * Responsibilities: render branch filters and active package cards.
 * Important notes: filters stay in search params so the page remains a Server Component.
 */
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { PackageCard } from "@/features/packages/components/package-card";
import type { PublicPackage } from "@/features/packages/types/package.types";

type PackageCatalogProps = {
  branches: PublicBranch[];
  packages: PublicPackage[];
  selectedBranchId?: string;
};

const INR_PRICE_FORMATTER = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

/**
 * Renders public branch tabs and package cards.
 */
export function PackageCatalog({
  branches,
  packages,
  selectedBranchId,
}: PackageCatalogProps) {
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
              <Link href={`/packages?branchId=${branch.id}`}>{branch.nameHi}</Link>
            </Button>
          ))}
        </div>
        {selectedBranch ? (
          <p className="text-sm text-muted-foreground">
            Showing packages for {selectedBranch.nameHi}, {selectedBranch.city}.
          </p>
        ) : null}
      </section>

      {packages.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard
              branch={pkg.branch.nameHi}
              description={pkg.descriptionHi}
              duration={pkg.durationMinutes ? `${pkg.durationMinutes} min` : null}
              imageUrl={pkg.imageUrl}
              key={pkg.id}
              nameEn={pkg.nameEn}
              nameHi={pkg.nameHi}
              price={formatPrice(pkg.price)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-stone-300 bg-white p-6 text-sm text-muted-foreground">
          No active packages are listed
          {selectedBranch ? ` for ${selectedBranch.nameHi}` : ""} yet.
        </div>
      )}
    </div>
  );
}

/**
 * Formats API decimal strings as Indian rupee values.
 */
function formatPrice(price: string) {
  return INR_PRICE_FORMATTER.format(Number(price));
}
