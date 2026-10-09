import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { formatDuration } from "@/features/package/schemas";
import type { PublicPackage } from "@/features/package/types";
import { Gift } from "lucide-react";
import Link from "next/link";

/** Sum of the standalone prices of every service inside the package. */
export function packageServicesTotal(pkg: PublicPackage): number {
  return pkg.services.reduce((sum, line) => sum + line.service.price, 0);
}

/**
 * Public package cards — combos with included services, duration, and a
 * savings strikethrough that only appears when the math actually favors
 * the package.
 */
export function PackageCards({
  salonSlug,
  packages,
}: {
  salonSlug: string;
  packages: PublicPackage[];
}) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((pkg) => {
        const total = packageServicesTotal(pkg);
        const savingsPercent =
          total > pkg.price ? Math.round(((total - pkg.price) / total) * 100) : 0;

        return (
          <article
            key={pkg.id}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
          >
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
                    <Badge className="bg-accent text-accent-foreground">
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
