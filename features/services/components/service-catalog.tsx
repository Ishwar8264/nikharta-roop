/**
 * Purpose: Public service catalog UI for branch-aware discovery.
 * Responsibilities: render branch tabs, category filters, and service cards from API-shaped data.
 * Important notes: links use query params so the page remains a Server Component with no client state.
 */
import Link from "next/link";

import { ServiceCard } from "@/components/services/service-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import type {
  PublicServiceCategory,
  PublicServiceDetail,
} from "@/features/services/types/service.types";

type ServiceCatalogProps = {
  branches: PublicBranch[];
  categories: PublicServiceCategory[];
  selectedBranchId?: string;
  selectedCategorySlug?: string;
  services: PublicServiceDetail[];
};

const INR_PRICE_FORMATTER = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

/**
 * Renders the public catalog with stable server-rendered filters.
 */
export function ServiceCatalog({
  branches,
  categories,
  selectedBranchId,
  selectedCategorySlug,
  services,
}: ServiceCatalogProps) {
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
              <Link href={`/services?branchId=${branch.id}`}>{branch.nameHi}</Link>
            </Button>
          ))}
        </div>
        {selectedBranch ? (
          <p className="text-sm text-muted-foreground">
            Showing services for {selectedBranch.nameHi}, {selectedBranch.city}.
          </p>
        ) : null}
      </section>

      {categories.length > 0 ? (
        <section className="flex flex-wrap gap-2">
          <CategoryLink
            branchId={selectedBranchId}
            isActive={!selectedCategorySlug}
            label="All services"
          />
          {categories.map((category) => (
            <CategoryLink
              branchId={selectedBranchId}
              categorySlug={category.slug}
              isActive={category.slug === selectedCategorySlug}
              key={category.id}
              label={category.nameHi}
            />
          ))}
        </section>
      ) : null}

      {services.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              actionLabel="Book now"
              branch={service.branch.nameHi}
              category={service.category.nameHi}
              description={service.descriptionHi}
              duration={`${service.durationMinutes} min`}
              href={`/account/book?serviceId=${service.id}&branchId=${service.branchId}`}
              key={service.id}
              meta={formatServiceMeta(service)}
              nameEn={service.nameEn}
              nameHi={service.nameHi}
              price={formatPrice(service.price)}
            />
          ))}
        </div>
      ) : (
        <EmptyCatalog selectedBranchName={selectedBranch?.nameHi} />
      )}
    </div>
  );
}

type CategoryLinkProps = {
  branchId?: string;
  categorySlug?: string;
  isActive: boolean;
  label: string;
};

/**
 * Builds a category filter link while preserving the selected branch.
 */
function CategoryLink({
  branchId,
  categorySlug,
  isActive,
  label,
}: CategoryLinkProps) {
  const params = new URLSearchParams();

  if (branchId) {
    params.set("branchId", branchId);
  }

  if (categorySlug) {
    params.set("category", categorySlug);
  }

  return (
    <Link href={`/services?${params.toString()}`}>
      <Badge variant={isActive ? "default" : "outline"}>{label}</Badge>
    </Link>
  );
}

/**
 * Shows an empty state that still tells the customer which branch was selected.
 */
function EmptyCatalog({ selectedBranchName }: { selectedBranchName?: string }) {
  return (
    <div className="rounded-md border border-dashed border-stone-300 bg-white p-6 text-sm text-muted-foreground">
      No active services are listed
      {selectedBranchName ? ` for ${selectedBranchName}` : ""} yet.
    </div>
  );
}

/**
 * Formats variant/add-on counts without exposing empty counters.
 */
function formatServiceMeta(service: PublicServiceDetail) {
  const variantCount = service.variants?.length ?? 0;
  const addOnCount = service.addOns?.length ?? 0;
  const parts = [
    variantCount ? `${variantCount} variants` : null,
    addOnCount ? `${addOnCount} add-ons` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

/**
 * Formats API decimal strings as Indian rupee values for catalog cards.
 */
function formatPrice(price: string) {
  return INR_PRICE_FORMATTER.format(Number(price));
}
