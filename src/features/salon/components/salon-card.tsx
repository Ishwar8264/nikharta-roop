import { ArrowRight, MapPin } from "lucide-react";

import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

import { CoverImage } from "@/components/shared/cover-image";
import { NavLink } from "@/components/shared/nav-link";
import type { PublicSalon } from "../types";

const CATEGORY_LABELS: Record<PublicSalon["category"], string> = {
  UNISEX: "Unisex",
  MALE: "Men",
  FEMALE: "Women",
  KIDS: "Kids",
};

interface SalonCardProps {
  salon: PublicSalon;
  className?: string;
}

/**
 * Salon card — the unit of the listing grid.
 *
 * Why the outer element is a <div>:
 * The card must not be an anchor itself, because the footer contains a real
 * <NavLink>. Nesting anchors is invalid HTML and React warns on render.
 *
 * Why the NavLink uses `after:absolute after:inset-0`:
 * The pseudo-element stretches the link's hit area across the whole card.
 * One real anchor, whole-card clickability, no nested links.
 */
export function SalonCard({ salon, className }: SalonCardProps) {
  const cover = salon.images[0];
  const location = [salon.city, salon.state].filter(Boolean).join(", ");

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
    >
      {/* Cover */}
      <div className="relative  w-full overflow-hidden bg-muted">
        {cover ? (
          <CoverImage
            src={cover}
            alt={salon.name}
            aspect="wide"
            rounded="md"
            priority
            emptyLabel="No cover image"
          />
        ) : null}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          {CATEGORY_LABELS[salon.category]}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-heading text-base font-semibold tracking-tight text-foreground">
          {salon.name}
        </h3>

        {location ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </p>
        ) : null}

        {salon.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {salon.description}
          </p>
        ) : null}
      </div>

      {/* Footer — NavLink stretched over the card */}
      {/* Footer — NavLink stretched over the card */}
      <NavLink
        href={routes.salonDetail(salon.slug)}
        variant="link"
        markActive={false}
        matchNested={false}
        iconRight={
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        }
        spinnerClassName="h-4 w-4 text-primary"
        className={cn(
          "w-full justify-between border-t border-border px-4 py-3",
          "font-medium text-primary",
        )}
      >
        View salon
      </NavLink>
    </div>
  );
}
