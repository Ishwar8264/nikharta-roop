import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { formatDuration } from "@/features/package/schemas";
import type { PublicPackage } from "@/features/package/types";
import { Flame, Gift } from "lucide-react";
import Link from "next/link";

/** Sum of the standalone prices of every service inside the package. */
export function packageServicesTotal(pkg: PublicPackage): number {
  return pkg.services.reduce((sum, line) => sum + line.service.price, 0);
}

/**
 * Public package cards — combos with included services, duration, and a
 * savings strikethrough that only appears when the math actually favours
 * the package.
 */
export function PackageCards({
  salonSlug,
  packages,
}: {
  salonSlug: string;
  packages: PublicPackage[];
}) {
  // Pick the "popular" package — the one with the highest savings %.
  // Falls back to the first package when none have measurable savings.
  const popularId = packages.length
    ? packages.reduce<{ id: string | null; pct: number }>(
        (acc, pkg) => {
          const total = packageServicesTotal(pkg);
          const pct =
            total > pkg.price ? Math.round(((total - pkg.price) / total) * 100) : 0;
          return pct > acc.pct ? { id: pkg.id, pct } : acc;
        },
        { id: packages[0]?.id ?? null, pct: 0 },
      ).id
    : null;

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => {
        const total = packageServicesTotal(pkg);
        const savingsPercent =
          total > pkg.price ? Math.round(((total - pkg.price) / total) * 100) : 0;
        const isPopular = pkg.id === popularId;

        return (
          <article
            key={pkg.id}
            className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            {isPopular ? (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                <Flame className="h-3 w-3" aria-hidden="true" />
                Popular
              </span>
            ) : null}

            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-semibold leading-tight">
                  {pkg.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDuration(pkg.duration)}
                </p>
              </div>
            </div>

            {pkg.services.length > 0 ? (
              <div>
                <p className="text-xs text-muted-foreground">Includes</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {pkg.services.map((line) => (
                    <li key={line.serviceId}>
                      <Badge variant="secondary">{line.service.name}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-auto space-y-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xl font-semibold">
                  {appointmentPriceFormatter.format(pkg.price)}
                </span>
                {savingsPercent > 0 ? (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      {appointmentPriceFormatter.format(total)}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-accent/30 bg-accent/10 text-accent-foreground"
                    >
                      Save {savingsPercent}%
                    </Badge>
                  </>
                ) : null}
              </div>
              <Button
                render={<Link href={`${routes.salonBooking(salonSlug)}?package=${pkg.id}`} />}
                className="w-full"
              >
                Book this package
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
