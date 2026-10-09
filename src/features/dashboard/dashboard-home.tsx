import { Gift } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CurrentUser } from "@/server/modules/auth/auth.types";
import type { SalonOwnerStats } from "@/server/modules/salon/salon-stats.types";
import type { SalonWithViewerRole } from "@/server/modules/salon/salon.types";
import type { PublicSalonVerification } from "@/server/modules/verification/verification.types";
import { cn } from "@/lib/utils";

import {
  CUSTOMER_QUICK_LINKS,
  QuickLinks,
  buildSalonManageLinks,
} from "./quick-links";
import { SalonStatsCard } from "./salon-stats-card";
import { VerificationBanner } from "./verification-banner";

interface DashboardHomeProps {
  user: CurrentUser;
  /** Most recent salon the user owns or manages. Null when not an owner/manager. */
  ownedSalon: SalonWithViewerRole | null;
  /**
   * Verification row for `ownedSalon`, or null when no row exists yet.
   * The page collapses `SalonVerificationNotFoundError` to null so this
   * component can branch purely on the row's presence.
   */
  verification: PublicSalonVerification | null;
  /**
   * At-a-glance stats for `ownedSalon`, or null when not an owner/manager.
   * The page resolves this in parallel with `verification` so the stats
   * card renders in the same wave as the banner above it.
   */
  stats: SalonOwnerStats | null;
}

/**
 * Server-rendered customer dashboard home.
 *
 * Why a separate presentational component:
 * The page (`dashboard/page.tsx`) owns the data orchestration — fetching
 * the session, the owned salon summary, and the verification row. Keeping
 * the JSX here lets the page stay a thin data pipeline and makes the
 * dashboard trivially testable: pass mock props and assert on the markup.
 *
 * Why no "use client":
 * Every interactive affordance is a Link. No state, no effects, no event
 * handlers — the whole tree renders on the server, which is the fastest
 * path for a screen the user hits on every sign-in.
 */
export function DashboardHome({
  user,
  ownedSalon,
  verification,
  stats,
}: DashboardHomeProps) {
  const greeting = user.name ?? "there";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold sm:text-4xl">
          Hi, {greeting}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your bookings, favourites, rewards, and salon in one place.
        </p>
      </header>

      {ownedSalon ? (
        <section className="mt-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-lg font-semibold">
              Salon owner
            </h2>
            <Badge variant="secondary">{ownedSalon.viewerRole}</Badge>
            <span className="text-sm text-muted-foreground">
              {ownedSalon.name}
            </span>
          </div>
          <VerificationBanner
            salonSlug={ownedSalon.slug}
            salonName={ownedSalon.name}
            verification={verification}
          />
          <SalonStatsCard stats={stats} />
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Loyalty points</h2>
        <Card className="mt-3">
          <CardContent className="flex items-center gap-4">
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                "bg-primary/10 text-primary",
              )}
              aria-hidden="true"
            >
              <Gift className="h-6 w-6" />
            </span>
            <div>
              <p className="font-heading text-2xl font-semibold">
                {user.loyaltyPoints}
              </p>
              <p className="text-sm text-muted-foreground">
                Available points
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold">Quick links</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jump back into what matters.
        </p>
        <div className="mt-4">
          <QuickLinks links={CUSTOMER_QUICK_LINKS} />
        </div>
      </section>

      {ownedSalon ? (
        <section className="mt-8">
          <h2 className="font-heading text-lg font-semibold">
            Manage your salon
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ownedSalon.name}
          </p>
          <div className="mt-4">
            <QuickLinks links={buildSalonManageLinks(ownedSalon.slug)} />
          </div>
        </section>
      ) : null}
    </main>
  );
}
