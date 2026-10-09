import { Gift, Info, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { NavLink } from "@/components/shared/nav-link";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { PackageCards } from "@/features/package/package-cards";
import { getSession } from "@/lib/auth/get-session";
import { JsonLd } from "@/lib/seo/json-ld";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import {
  getSalonForServiceManagement,
  getSalonSummaryBySlug,
} from "@/server/modules/salon/salon.service";
import { listSalonPackageCatalog } from "@/server/modules/package/package.service";

interface Props {
  params: Promise<{ slug: string }>;
}

const getSalon = async (slug: string) => {
  try {
    return await getSalonSummaryBySlug(slug);
  } catch (error) {
    if (error instanceof SalonNotFoundError) notFound();
    throw error;
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const salon = await getSalon(slug);
    const title = `${salon.name} Packages & Combos in ${salon.city} | Nikharta Roop`;
    return {
      title,
      description: `Browse bridal, grooming, and wellness packages at ${salon.name} in ${salon.city}. Compare combos, see savings, and book online.`,
      alternates: { canonical: routes.salonPackages(slug) },
      openGraph: { title, type: "website" },
    };
  } catch {
    return { title: "Packages not found · Nikharta Roop" };
  }
}

/** Public packages catalogue for one salon. */
export default async function SalonPackagesPage({ params }: Props) {
  const { slug } = await params;
  const [salon, packagesResult, user] = await Promise.all([
    getSalon(slug),
    listSalonPackageCatalog(slug, { limit: 20 }),
    getSession(),
  ]);

  let canManage = false;
  if (user) {
    try {
      await getSalonForServiceManagement(slug, user.id);
      canManage = true;
    } catch (error) {
      if (
        !(error instanceof SalonNotFoundError) &&
        !(error instanceof SalonRoleInsufficientError)
      ) {
        throw error;
      }
    }
  }

  // Offer list for the top five packages — prices in INR, availability wide.
  const offers = packagesResult.items.slice(0, 5).map((pkg) => ({
    "@type": "Offer",
    name: pkg.name,
    price: pkg.price,
    priceCurrency: siteConfig.currency,
    availability: "https://schema.org/InStock",
    url: `${siteConfig.url}${routes.salonBooking(slug)}?package=${pkg.id}`,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {offers.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${salon.name} packages`,
            offers,
          }}
        />
      ) : null}


      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-primary">{salon.name}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold">
            Packages &amp; Combos
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Bundled services at one price — bridal days, grooming resets, and
            more, all in {salon.city}.
          </p>
        </div>
        {canManage ? (
          <NavLink
            href={routes.salonPackagesManage(slug)}
            variant="outline"
            markActive={false}
          >
            Manage packages
          </NavLink>
        ) : null}
      </header>

      {packagesResult.items.length > 0 ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm">
          <span className="mt-0.5 shrink-0 text-accent">
            <Info className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="space-y-0.5">
            <p className="font-medium text-accent-foreground">
              Packages include every service listed on the card.
            </p>
            <p className="text-muted-foreground">
              Pay one price for the whole combo — usually less than booking each
              service separately. Strikethrough shows the à la carte total.
            </p>
          </div>
        </div>
      ) : null}

      {packagesResult.items.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="This salon hasn't added packages yet"
          description="Combos like bridal days and grooming resets will show up here once the salon publishes them. Services are still available to book individually."
          action={
            <NavLink
              href={routes.salonServices(slug)}
              variant="default"
              size="lg"
              markActive={false}
              iconRight={<Sparkles className="h-4 w-4" aria-hidden="true" />}
            >
              Browse services
            </NavLink>
          }
        />
      ) : (
        <PackageCards salonSlug={slug} packages={packagesResult.items} />
      )}
    </main>
  );
}
