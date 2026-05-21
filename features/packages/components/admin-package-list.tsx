/**
 * Purpose: Admin package overview list.
 * Responsibilities: render package cards with branch, status, price, duration, and attached services.
 * Important notes: empty state explains when no package exists in the current admin scope.
 */
import { PackageCard } from "@/features/packages/components/package-card";
import type { PublicPackageDetail } from "@/features/packages/types/package.types";

type AdminPackageListProps = {
  packages: PublicPackageDetail[];
};

const INR_PRICE_FORMATTER = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

/**
 * Renders packages visible to the authenticated admin.
 */
export function AdminPackageList({ packages }: AdminPackageListProps) {
  if (packages.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-stone-300 bg-white p-6 text-sm text-muted-foreground">
        No packages are available for your admin scope yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {packages.map((pkg) => (
        <PackageCard
          branch={`${pkg.branch.nameHi}, ${pkg.branch.city}`}
          description={pkg.descriptionHi}
          duration={pkg.durationMinutes ? `${pkg.durationMinutes} min` : null}
          imageUrl={pkg.imageUrl}
          isActive={pkg.isActive}
          key={pkg.id}
          nameEn={pkg.nameEn}
          nameHi={pkg.nameHi}
          price={formatPrice(pkg.price)}
          services={pkg.services.map((item) => item.service.nameHi)}
        />
      ))}
    </div>
  );
}

/**
 * Formats API decimal strings as Indian rupee values.
 */
function formatPrice(price: string) {
  return INR_PRICE_FORMATTER.format(Number(price));
}
