import type { LucideIcon } from "lucide-react";
import { Banknote, CalendarDays, Clock, Package, Scissors } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import type { SalonOwnerStats } from "@/server/modules/salon/salon-stats.types";

interface SalonStatsCardProps {
  /** Resolved owner stats, or null when the caller is not a salon owner. */
  stats: SalonOwnerStats | null;
}

/**
 * Server-rendered stats card shown on the dashboard for salon owners.
 *
 * Why a server component:
 * Every value is already fetched by the page — no client state, no effects,
 * no event handlers. Rendering on the server ships the markup in the initial
 * HTML so an owner sees their today / this-week snapshot on first paint,
 * without a loading spinner or a second round trip.
 *
 * Why only services and packages tiles are links:
 * "Today's appointments" and "This week's revenue" are summary metrics — the
 * owner reads them at a glance. Services and packages are catalogue
 * surfaces the owner actively manages, so those tiles deep-link into the
 * corresponding manage page (the same targets as the manage quick-links
 * grid below).
 *
 * Why the verification badge lives in the card header:
 * The dedicated verification banner above already explains the full status.
 * Repeating the badge here gives the owner a persistent reminder that the
 * stats card's revenue number is provisional until verification clears —
 * without duplicating the banner's copy.
 */
export function SalonStatsCard({ stats }: SalonStatsCardProps) {
  if (!stats) return null;

  const { salon, todaysAppointments, pendingVerification } = stats;
  const todaysSubtext = `${todaysAppointments.upcoming} upcoming · ${todaysAppointments.inProgress} in progress · ${todaysAppointments.completed} done`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-heading text-base font-semibold">
            Today at {salon.name}
          </CardTitle>
          {pendingVerification ? (
            <Badge
              variant="outline"
              render={
                <Link
                  href={routes.salonVerification(salon.slug)}
                  aria-label="Verification pending — open the verification page"
                />
              }
            >
              <Clock aria-hidden="true" data-icon="inline-start" />
              Verification pending
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <ul
          className={cn(
            "grid grid-cols-1 gap-3",
            "sm:grid-cols-2 lg:grid-cols-4",
          )}
        >
          <li>
            <StatTile
              icon={CalendarDays}
              tone="primary"
              value={String(todaysAppointments.total)}
              label="Today's appointments"
              subtext={todaysSubtext}
            />
          </li>
          <li>
            <StatTile
              icon={Banknote}
              tone="success"
              value={appointmentPriceFormatter.format(stats.thisWeekRevenue)}
              label="This week's revenue"
            />
          </li>
          <li>
            <Link
              href={routes.salonServicesManage(salon.slug)}
              className={cn(
                "group/stat block rounded-lg outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            >
              <StatTile
                icon={Scissors}
                tone="info"
                value={String(stats.activeServices)}
                label="Active services"
                interactive
              />
            </Link>
          </li>
          <li>
            <Link
              href={routes.salonPackagesManage(salon.slug)}
              className={cn(
                "group/stat block rounded-lg outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            >
              <StatTile
                icon={Package}
                tone="secondary"
                value={String(stats.activePackages)}
                label="Active packages"
                interactive
              />
            </Link>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

interface StatTileProps {
  icon: LucideIcon;
  tone: StatTileTone;
  value: string;
  label: string;
  subtext?: string;
  /** When true the tile is wrapped in a Link and gains hover affordance. */
  interactive?: boolean;
}

type StatTileTone = "primary" | "success" | "info" | "secondary";

const TONE_CIRCLE: Record<StatTileTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
  secondary: "bg-secondary/60 text-secondary-foreground",
};

/**
 * One stat tile — icon, big number, label, optional subtext.
 *
 * Why a `tone` prop instead of inheriting per-tile classes:
 * Each tile owns its semantic colour (appointments=primary, revenue=success,
 * services=info, packages=secondary). Keeping the mapping in a small record
 * means a future re-skin is one edit, not a search-and-replace across JSX.
 */
function StatTile({
  icon: Icon,
  tone,
  value,
  label,
  subtext,
  interactive = false,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-2 rounded-lg border border-foreground/5 bg-muted/30 p-4",
        interactive &&
          "transition-colors group-hover/stat:border-primary/30 group-hover/stat:bg-muted/60",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          TONE_CIRCLE[tone],
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="font-heading text-2xl font-semibold text-foreground">
        {value}
      </p>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {subtext ? (
        <p className="text-xs text-muted-foreground">{subtext}</p>
      ) : null}
    </div>
  );
}
