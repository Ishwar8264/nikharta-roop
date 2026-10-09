import { SearchX, Sparkles, Store } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState, Pagination } from "@/components/shared";
import { ClearLink } from "@/components/shared/clear-link";
import { NavLink } from "@/components/shared/nav-link";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import type { SalonFilters } from "@/features/salon";
import { FilterBar, SalonCard } from "@/features/salon";
import { listSalons } from "@/server/modules/salon/salon.service";

export const metadata: Metadata = {
  title: "Salons · Nikharta Roop",
  description:
    "Browse verified salons across India — filter by city, category, and service.",
  alternates: { canonical: "/salons" },
};

interface SalonsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Public salon listing.
 *
 * Why a server component that calls the service directly:
 * Server Components live in the same Node.js process as the service layer.
 * Routing through `/api/v1/salons` would add a self-fetch round trip that
 * costs latency and re-serializes the same data — with no benefit, since
 * the caller is already trusted (it is our own server).
 *
 * Why searchParams drives the query:
 * Keeping filters in the URL means the same server render handles every
 * combination, every result is shareable and bookmarkable, and the browser
 * Back button works without a single line of client-side state.
 */
export default async function SalonsPage({ searchParams }: SalonsPageProps) {
  const params = await searchParams;

  const filters: SalonFilters = {
    city: typeof params.city === "string" ? params.city : undefined,
    category:
      params.category === "MALE" ||
      params.category === "FEMALE" ||
      params.category === "UNISEX" ||
      params.category === "KIDS"
        ? params.category
        : undefined,
    search: typeof params.search === "string" ? params.search : undefined,
    cursor: typeof params.cursor === "string" ? params.cursor : undefined,
  };

  // Run the data fetch and the session read in parallel — both are
  // independent and each can take a network round trip.
  const [result, user] = await Promise.all([
    listSalons({
      ...filters,
      limit: 12,
    }),
    getSession(),
  ]);

  const hasFilters = Boolean(
    filters.city || filters.category || filters.search,
  );

  // Base params for pagination — same filters, no cursor.
  const baseParams = new URLSearchParams();
  if (filters.city) baseParams.set("city", filters.city);
  if (filters.category) baseParams.set("category", filters.category);
  if (filters.search) baseParams.set("search", filters.search);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero — warm gradient, value prop, and a clear entry to search */}
      <header className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-accent/15 px-5 py-8 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Verified partners across India
          </span>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Find your next salon
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Browse salons and studios near you. Book appointments, explore
            packages, and discover trusted stylists — all in one place.
          </p>
        </div>
      </header>

      {/* Filter bar — elevated onto a card surface so it reads as the primary
          search affordance the hero just set up. */}
      <div className="mt-5 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <FilterBar initial={filters} />
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={hasFilters ? SearchX : Store}
          title={
            hasFilters ? "No salons match your filters" : "No salons listed yet"
          }
          description={
            hasFilters
              ? "Try removing a filter or searching for a different city."
              : user
                ? "Be the first to list your salon and start receiving bookings."
                : "We are onboarding salons in your area. Sign in to list yours."
          }
          action={
            hasFilters ? (
              <ClearLink href="/salons" label="Clear filters" />
            ) : user ? (
              <NavLink
                href={routes.salonCreate}
                variant="default"
                size="lg"
                markActive={false}
                iconRight={<Store className="h-4 w-4" aria-hidden="true" />}
              >
                List your salon
              </NavLink>
            ) : (
              <NavLink
                href={`${routes.login}?redirect=${encodeURIComponent(routes.salonCreate)}`}
                variant="default"
                size="lg"
                markActive={false}
              >
                Sign in to list a salon
              </NavLink>
            )
          }
        />
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
            Showing {result.items.length} salon
            {result.items.length === 1 ? "" : "s"}
            {filters.city ? ` in ${filters.city}` : ""}
          </p>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>

          <Pagination
            hasMore={result.hasMore}
            nextCursor={result.nextCursor}
            buildHref={(cursor) => {
              const p = new URLSearchParams(baseParams.toString());
              p.set("cursor", cursor);
              return `?${p.toString()}`;
            }}
            label="Load more salons"
          />
        </>
      )}
    </main>
  );
}
