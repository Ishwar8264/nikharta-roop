import { Globe, Mail, MapPin, Pencil, Phone } from "lucide-react";
import Link from "next/link";

import { BackButton } from "@/components/shared/back-button";
import { CoverImage } from "@/components/shared/cover-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import type { PublicSalon } from "@/server/modules/salon/salon.types";
import { SalonGallery } from "./gallery";
import { SalonMapPreview } from "./map-preview";

const CATEGORY_LABEL: Record<PublicSalon["category"], string> = {
  UNISEX: "Unisex",
  MALE: "Men only",
  FEMALE: "Women only",
  KIDS: "Kids",
};

interface SalonDetailProps {
  salon: PublicSalon;
  /** Wire this once the auth check on the page is in place. */
  canEdit?: boolean;
}

export function SalonDetail({ salon, canEdit }: SalonDetailProps) {
  const cover = salon.images[0];
  const gallery = salon.images.slice(1);
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${salon.lat},${salon.lng}`;

  return (
    <article className="mx-auto w-full max-w-6xl space-y-2 py-2 ">
      <BackButton href="/salons" variant="secondary" />

      {/* Cover */}

      <div className="relative">
        {cover ? (
          <CoverImage
            src={salon.images[0] ?? null}
            alt={salon.name}
            aspect="wide"
            rounded="md"
            priority
            emptyLabel="No cover image"
          />
        ) : null}
      </div>

      {/* Header */}
      <header className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary">
            {CATEGORY_LABEL[salon.category] ?? salon.category}
          </Badge>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {salon.name}
          </h1>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {salon.address}, {salon.city}, {salon.state} {salon.zip}
            </span>
          </p>
        </div>

        {canEdit ? (
          <Button variant="outline" className="shrink-0">
            <Link href={routes.salonDetail(salon.slug) + "/edit"}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Edit salon
            </Link>
          </Button>
        ) : null}
      </header>

      {/* Content + Sidebar */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {salon.description ? (
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-semibold">About</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {salon.description}
              </p>
            </section>
          ) : null}

          {gallery.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-heading text-xl font-semibold">Gallery</h2>
              <SalonGallery images={gallery} name={salon.name} />
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold">Location</h2>
            <SalonMapPreview
              latitude={salon.lat}
              longitude={salon.lng}
              name={salon.name}
            />
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-heading text-base font-semibold">Contact</h3>

            <div className="mt-4 space-y-3 text-sm">
              {salon.phone ? (
                <a
                  href={`tel:${salon.phone}`}
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Phone
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {salon.phone}
                </a>
              ) : null}

              {salon.email ? (
                <a
                  href={`mailto:${salon.email}`}
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Mail
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {salon.email}
                </a>
              ) : null}

              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-primary"
              >
                <Globe
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                Get directions
              </a>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
