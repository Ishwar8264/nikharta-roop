import { MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

export interface SalonCardData {
  id: string;
  name: string;
  slug: string;
  city: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  image: string;
  category: string;
}

interface SalonCardProps {
  salon: SalonCardData;
  className?: string;
}

/**
 * Salon card — used on the homepage and (later) the salons listing.
 *
 * Why the image uses a fixed aspect ratio:
 * Grid rows stay aligned when every card has the same image height. A
 * variable aspect would let one tall photo push its row down and break the
 * scan line of the grid.
 *
 * Why price uses "from ₹X":
 * Salons price per service, not per visit. Showing the entry price sets a
 * low anchor while staying truthful — the detail page shows the full range.
 */
export function SalonCard({ salon, className }: SalonCardProps) {
  return (
    <Link
      href={routes.salonDetail(salon.slug)}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {/* ─── Image ─── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={salon.image}
          alt={`${salon.name} — ${salon.category} salon in ${salon.city}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {salon.category}
        </span>
      </div>

      {/* ─── Body ─── */}
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="font-heading text-base font-semibold tracking-tight text-foreground line-clamp-1">
            {salon.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {salon.city}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            <Star
              className="h-3.5 w-3.5 fill-[var(--rating)] text-[var(--rating)]"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold text-foreground">
              {salon.rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({salon.reviewCount})
            </span>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted-foreground">from</p>
            <p className="font-heading text-sm font-semibold text-foreground">
              ₹{salon.priceFrom}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
