import { SearchX } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState, Pagination } from "@/components/shared";
import { ClearLink } from "@/components/shared/clear-link";
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

  const result = await listSalons({
    ...filters,
    limit: 12,
  });

  const hasFilters = Boolean(
    filters.city || filters.category || filters.search,
  );

  // Base params for pagination — same filters, no cursor.
  const baseParams = new URLSearchParams();
  if (filters.city) baseParams.set("city", filters.city);
  if (filters.category) baseParams.set("category", filters.category);
  if (filters.search) baseParams.set("search", filters.search);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Browse salons
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.items.length > 0
            ? `Showing ${result.items.length} salon${result.items.length === 1 ? "" : "s"}`
            : "Verified partners across India"}
        </p>
      </header>

      <FilterBar initial={filters} />

      {result.items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={hasFilters ? "No salons match your filters" : "No salons yet"}
          description={
            hasFilters
              ? "Try removing a filter or searching for a different city."
              : "We are onboarding salons in your area. Check back soon."
          }
          action={
            hasFilters ? (
              <ClearLink href="/salons" label="Clear filters" />
            ) : null
          }
        />
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
