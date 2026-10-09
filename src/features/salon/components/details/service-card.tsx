import { Clock } from "lucide-react";

import { CoverImage } from "@/components/shared/cover-image";
import { NavLink } from "@/components/shared/nav-link";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface ServiceCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  duration: number;
  coverImage?: string | null;
  images: string[];
  category: { name: string; slug: string } | null;
}

interface SalonServiceCardProps {
  salonSlug: string;
  service: ServiceCardData;
  className?: string;
}

const priceFormatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  maximumFractionDigits: 2,
});

/** Displays a compact, reusable service summary with a booking action. */
export function SalonServiceCard({
  salonSlug,
  service,
  className,
}: SalonServiceCardProps) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <CoverImage
        src={service.coverImage ?? service.images[0]}
        alt={service.name}
        aspect="video"
        rounded="none"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        emptyLabel="No service image"
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {service.category ? (
              <Badge variant="secondary" className="mb-2">
                {service.category.name}
              </Badge>
            ) : null}
            <h3 className="line-clamp-2 font-heading text-base font-semibold">
              {service.name}
            </h3>
          </div>
          <span className="shrink-0 font-semibold text-primary">
            {priceFormatter.format(service.price)}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {service.duration} min
          </span>
          <NavLink
            href={routes.salonServiceDetail(salonSlug, service.slug)}
            variant="ghost"
            size="sm"
            markActive={false}
            className="ml-auto"
          >
            Details
          </NavLink>
          <NavLink
            href={`${routes.salonBooking(salonSlug)}?service=${encodeURIComponent(service.slug)}`}
            variant="outline"
            size="sm"
            markActive={false}
          >
            Book
          </NavLink>
        </div>
      </div>
    </article>
  );
}
