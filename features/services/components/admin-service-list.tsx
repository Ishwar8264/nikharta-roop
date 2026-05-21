/**
 * Purpose: Admin service overview for catalog management.
 * Responsibilities: summarize branch-linked services, status, variants, add-ons, and pricing.
 * Important notes: write actions remain API-backed, while this screen focuses on safe read wiring first.
 */
import { ServiceCard } from "@/components/services/service-card";
import type { PublicServiceDetail } from "@/features/services/types/service.types";

type AdminServiceListProps = {
  services: PublicServiceDetail[];
};

const INR_PRICE_FORMATTER = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 0,
  style: "currency",
});

/**
 * Renders services visible to the authenticated admin.
 */
export function AdminServiceList({ services }: AdminServiceListProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-stone-300 bg-white p-6 text-sm text-muted-foreground">
        No services are available for your admin scope yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <ServiceCard
          actionLabel="Manage"
          branch={`${service.branch.nameHi}, ${service.branch.city}`}
          category={service.category.nameHi}
          description={service.descriptionHi}
          duration={`${service.durationMinutes} min`}
          key={service.id}
          meta={formatAdminMeta(service)}
          nameEn={service.nameEn}
          nameHi={service.nameHi}
          price={formatPrice(service.price)}
          status={service.isActive ? "active" : "inactive"}
        />
      ))}
    </div>
  );
}

/**
 * Builds compact management metadata for variants and add-ons.
 */
function formatAdminMeta(service: PublicServiceDetail) {
  return [
    `${service.variants.length} variants`,
    `${service.addOns.length} add-ons`,
  ].join(" | ");
}

/**
 * Formats stored decimal strings for admin cards.
 */
function formatPrice(price: string) {
  return INR_PRICE_FORMATTER.format(Number(price));
}
