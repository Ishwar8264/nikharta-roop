import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { listSalons } from "@/server/modules/salon/salon.service";

const STATIC_PUBLIC_ROUTES = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/salons", changeFrequency: "daily", priority: 0.9 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/help", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
] as const satisfies ReadonlyArray<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}>;

/**
 * Lists canonical public pages for search-engine discovery.
 *
 * Why we pull salons at request time:
 * Sitemaps are fetched by crawlers occasionally, not on every page view, so
 * the cost of one DB round-trip is negligible. Emitting one entry per active
 * salon — both its detail page and its packages page — gives search engines
 * the deep links that the static list above cannot.
 *
 * Why we cap at 50: the sitemap is for discovery, not exhaustive indexing.
 * Larger catalogs belong in a paginated sitemap index (future work); for the
 * Phase A launch, surfacing the most recently created salons is enough.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_PUBLIC_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${siteConfig.url}${path}`,
      changeFrequency,
      priority,
    }),
  );

  try {
    const { items: salons } = await listSalons({ limit: 50 });
    const salonEntries: MetadataRoute.Sitemap = [];
    for (const salon of salons) {
      salonEntries.push({
        url: `${siteConfig.url}/salons/${salon.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      salonEntries.push({
        url: `${siteConfig.url}/salons/${salon.slug}/packages`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    return [...staticEntries, ...salonEntries];
  } catch {
    // If the database is unreachable, the static routes still ship — a
    // partial sitemap is better than a 500 that blocks crawl discovery.
    return staticEntries;
  }
}
