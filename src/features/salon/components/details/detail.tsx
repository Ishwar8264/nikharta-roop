import {
  ArrowRight,
  CalendarDays,
  Globe,
  Images,
  MapPin,
  Mail,
  Package,
  Pencil,
  Phone,
  Scissors,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { BackButton } from "@/components/shared/back-button";
import { CoverImage } from "@/components/shared/cover-image";
import { RichTextContent } from "@/components/shared/rich-text-content";
import { NavLink } from "@/components/shared/nav-link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FavoriteButton } from "@/features/favorite";
import { routes } from "@/config/routes";
import type { PublicSalonDetail } from "@/server/modules/salon/salon.types";
import { SalonGallery } from "./gallery";
import { SalonMapPreview } from "./map-preview";
import { SalonServiceCard } from "./service-card";
import { SalonWorkingHours } from "./working-hours";

const CATEGORY_LABEL: Record<PublicSalonDetail["category"], string> = {
  UNISEX: "Unisex",
  MALE: "Men only",
  FEMALE: "Women only",
  KIDS: "Kids",
};

/** Sticky in-page sub-nav. Mobile-first horizontal scroll, no JS. */
const SECTION_LINKS = [
  { href: "#services", label: "Services", icon: Scissors },
  { href: "#gallery", label: "Gallery", icon: Images },
  { href: "#location", label: "Location", icon: MapPin },
] as const;

interface SalonDetailProps {
  salon: PublicSalonDetail;
  canEdit?: boolean;
  /** True when the signed-in viewer already has this salon in their favourites. */
  isFavorited?: boolean;
  /** The favorite row id, when known — needed to call DELETE on unfavorite. */
  favoriteId?: string | null;
  /** The signed-in viewer's id. When null, the heart is hidden (anonymous). */
  currentUserId?: string | null;
}

export function SalonDetail({
  salon,
  canEdit,
  isFavorited = false,
  favoriteId = null,
  currentUserId = null,
}: SalonDetailProps) {
  const banner = salon.bannerImage ?? salon.coverImage ?? salon.images[0];
  const gallery = salon.images;
  const hasDescription = [
    salon.descriptionHtml,
    salon.descriptionJson,
    salon.description,
  ].some((value) => Boolean(value?.trim()));
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${salon.lat},${salon.lng}`;

  return (
    <article className="mx-auto w-full max-w-6xl space-y-2 py-2 ">
      <BackButton href="/salons" variant="secondary" />

      {/* Banner */}
      <div className="relative">
        {banner ? (
          <CoverImage
            src={banner}
            alt={salon.name}
            aspect="wide"
            rounded="md"
            priority
            emptyLabel="No banner image"
          />
        ) : null}
      </div>

      {/* Header */}
      <header className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {CATEGORY_LABEL[salon.category] ?? salon.category}
            </Badge>
            <Badge className="gap-1 bg-muted text-foreground" variant="default">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {salon.city}
            </Badge>
            {salon.verification?.status === "VERIFIED" ? (
              <Badge className="gap-1 bg-success/10 text-success focus-visible:ring-success/20 dark:bg-success/20">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Verified
              </Badge>
            ) : null}
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {salon.name}
          </h1>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {salon.address}, {salon.city}, {salon.state} {salon.zip}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href={routes.salonBooking(salon.slug)}
            className={buttonVariants({ size: "lg" })}
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Book appointment
          </Link>
          {currentUserId ? (
            <FavoriteButton
              targetType="salon"
              targetId={salon.id}
              targetName={salon.name}
              initial={isFavorited}
              initialFavoriteId={favoriteId}
            />
          ) : null}
          {canEdit ? (
            <Link
              href={routes.salonManage(salon.slug)}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Manage
            </Link>
          ) : null}
        </div>
      </header>

      {/* Sticky sub-nav — in-page anchors + links to the dedicated
          Packages / Products routes. `scroll-mt-24` on each target keeps
          the sticky bar from covering the section heading on jump. */}
      <nav
        aria-label="Salon sections"
        className="sticky top-0 z-30 mt-2 border-y border-border bg-background/80 px-2 backdrop-blur"
      >
        <ul className="flex items-center gap-1 overflow-x-auto py-2 text-sm">
          {SECTION_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </a>
            </li>
          ))}
          <li aria-hidden="true" className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <li>
            <NavLink
              href={routes.salonPackages(salon.slug)}
              variant="link"
              markActive={false}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 hover:bg-muted"
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              Packages
            </NavLink>
          </li>
          <li>
            <NavLink
              href={routes.salonProducts(salon.slug)}
              variant="link"
              markActive={false}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 hover:bg-muted"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Products
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Content + Sidebar */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {hasDescription ? (
            <section
              id="about"
              aria-labelledby="salon-about-title"
              className="scroll-mt-24 space-y-3"
            >
              <h2
                id="salon-about-title"
                className="font-heading text-xl font-semibold"
              >
                About
              </h2>
              <RichTextContent
                html={salon.descriptionHtml}
                json={salon.descriptionJson}
                text={salon.description}
              />
            </section>
          ) : null}

          {gallery.length > 0 ? (
            <section id="gallery" className="scroll-mt-24 space-y-3">
              <h2 className="font-heading text-xl font-semibold">Gallery</h2>
              <SalonGallery images={gallery} name={salon.name} eagerImageSrc={banner} />
            </section>
          ) : null}

          <section
            id="services"
            aria-labelledby="services-title"
            className="scroll-mt-24 space-y-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="services-title"
                  className="font-heading text-xl font-semibold"
                >
                  Services
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explore treatments offered by {salon.name}.
                </p>
              </div>

              {salon._count.services > salon.services.length ? (
                <NavLink
                  href={routes.salonServices(salon.slug)}
                  markActive={false}
                  className="font-medium text-primary"
                  iconRight={<ArrowRight className="h-4 w-4" />}
                >
                  View all {salon._count.services}
                </NavLink>
              ) : null}
            </div>

            {salon.services.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {salon.services.map((service) => (
                  <SalonServiceCard
                    key={service.id}
                    salonSlug={salon.slug}
                    service={service}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <Scissors
                  className="mx-auto h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  No services are available yet.
                </p>
              </div>
            )}
          </section>

          <section id="location" className="scroll-mt-24 space-y-3">
            <h2 className="font-heading text-xl font-semibold">Location</h2>
            <SalonMapPreview
              latitude={salon.lat}
              longitude={salon.lng}
              name={salon.name}
            />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <SalonWorkingHours
            hours={salon.workingHours}
            timezone={salon.timezone}
          />

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

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <Scissors className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="mt-2 text-xl font-semibold">
                {salon._count.services}
              </p>
              <p className="text-xs text-muted-foreground">Services</p>
            </div>
            <Link
              href={routes.salonProducts(salon.slug)}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Package className="h-4 w-4 text-primary" aria-hidden="true" />
              <p className="mt-2 text-xl font-semibold">
                {salon._count.products}
              </p>
              <p className="text-xs text-muted-foreground">Products</p>
            </Link>
          </div>
        </aside>
      </div>

      {/* Sticky mobile book bar — full-width primary CTA, always reachable
          without scrolling back to the top. Hidden on >= sm where the
          in-header Book button is always in view. */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <Link
          href={routes.salonBooking(salon.slug)}
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Book appointment at {salon.name}
        </Link>
      </div>
    </article>
  );
}
