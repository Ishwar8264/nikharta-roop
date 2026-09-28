import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { PublicSalon } from "../types";

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
 * Why no rating/price in this version:
 * The backend's PublicSalon shape does not yet carry aggregate rating or
 * a "from" price. Rendering placeholders for those fields would be lying
 * to the user; once the API exposes them, we extend this card.
 *
 * Why a fixed aspect ratio:
 * Grid rows stay aligned when every image has the same height. A variable
 * aspect lets one tall photo push its row down and break the scan line.
 */
export function SalonCard({ salon, className }: SalonCardProps) {
  const cover = salon.images[0];

  return (
    <Link
      href={routes.salonDetail(salon.slug)}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={cover}
            alt={`${salon.name} — salon in ${salon.city}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
          {CATEGORY_LABELS[salon.category]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-heading text-base font-semibold tracking-tight text-foreground line-clamp-1">
          {salon.name}
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {salon.city}, {salon.state}
        </p>
        {salon.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {salon.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
