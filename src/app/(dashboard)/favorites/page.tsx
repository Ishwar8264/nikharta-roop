import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Scissors, Sparkles } from "lucide-react";

import { BackButton } from "@/components/shared/back-button";
import { CoverImage } from "@/components/shared/cover-image";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/features/favorite";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import { listFavorites } from "@/server/modules/favorite/favorite.service";
import type { PublicFavorite } from "@/server/modules/favorite/favorite.types";

export const metadata: Metadata = {
  title: "Favourites · Nikharta Roop",
  description:
    "The salons, services, and products you have saved for later.",
};

const TYPE_LABEL: Record<PublicFavorite["type"], string> = {
  salon: "Salon",
  service: "Service",
  product: "Product",
};

const TYPE_ICON: Record<PublicFavorite["type"], typeof Heart> = {
  salon: Heart,
  service: Scissors,
  product: Sparkles,
};

/**
 * Builds the deep-link href for one favorite. Salons have a globally unique
 * slug and a public detail route. Services and products only expose their
 * own slug through the favorite's `target` (the polymorphic favorite row
 * does not carry the parent salon's slug), so they link back to the salon
 * directory — the customer's next step is to search from there.
 */
function buildFavoriteHref(favorite: PublicFavorite): string {
  if (favorite.type === "salon") {
    return routes.salonDetail(favorite.target.slug);
  }
  return routes.salons;
}

/**
 * Customer-facing favourites dashboard.
 *
 * Why a server page instead of a client fetch:
 * The favorites list is small (capped at 50) and the page is reached via an
 * authenticated navigation, so a single server render delivers the data with
 * the markup in one wave — no client-side loading spinner, no auth refresh
 * dance. Mutations (unfavorite) run through `FavoriteButton` which owns its
 * own optimistic state and toasts.
 */
export default async function FavoritesPage() {
  const user = await getSession();
  // The (dashboard) layout already redirects anonymous viewers to /login.
  // TypeScript still sees `user` as nullable from `getSession()`'s signature,
  // so this guard is a no-op at runtime but a hard requirement for the
  // compiler — same pattern as `dashboard/page.tsx`.
  if (!user) return null;

  const result = await listFavorites(user.id, { limit: 50 });
  const favorites = result.items;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <BackButton href={routes.dashboard} variant="secondary" />

      <header className="mt-4 space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Favourites
        </h1>
        <p className="text-muted-foreground">
          The salons, services, and products you have saved for later.
        </p>
      </header>

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favourites yet"
          description="Tap the heart on a salon, service, or product to save it here for later."
          action={
            <Link
              href={routes.salons}
              className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse salons
            </Link>
          }
        />
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {favorites.map((favorite) => {
            const TypeIcon = TYPE_ICON[favorite.type];
            return (
              <li
                key={favorite.id}
                className="flex min-w-0 gap-4 rounded-xl border border-border bg-card p-4"
              >
                <Link
                  href={buildFavoriteHref(favorite)}
                  className="shrink-0"
                  aria-label={`Open ${favorite.target.name}`}
                >
                  <CoverImage
                    src={favorite.target.images[0]}
                    alt={favorite.target.name}
                    aspect="square"
                    rounded="lg"
                    sizes="80px"
                    className="size-20"
                    emptyLabel="No image"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={buildFavoriteHref(favorite)}
                        className="block truncate font-medium hover:text-primary"
                      >
                        {favorite.target.name}
                      </Link>
                      <Badge variant="secondary" className="mt-1 gap-1">
                        <TypeIcon className="h-3 w-3" aria-hidden="true" />
                        {TYPE_LABEL[favorite.type]}
                      </Badge>
                    </div>
                    <FavoriteButton
                      targetType={favorite.type}
                      targetId={favorite.targetId}
                      targetName={favorite.target.name}
                      initial
                      initialFavoriteId={favorite.id}
                      variant="ghost"
                      size="icon-sm"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
