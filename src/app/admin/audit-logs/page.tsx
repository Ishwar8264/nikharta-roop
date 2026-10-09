import type { Metadata } from "next";
import Link from "next/link";

import { Pagination } from "@/components/shared";
import { AuditLogTable } from "@/features/admin";
import type { PublicAuditLog } from "@/features/admin";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import { listLogs } from "@/server/modules/audit/audit.service";

export const metadata: Metadata = {
  title: "Audit logs | Admin",
  description: "Platform audit trail — every administrative and write action.",
  robots: { index: false, follow: false },
};

/**
 * Common entity types surfaced as filter chips. The schema accepts any
 * 1–64-char string, so this list is a convenience — anything else falls under
 * the "All" view. Add new entries here as the platform grows new audited
 * entities.
 */
const ENTITY_FILTERS = [
  "User",
  "Salon",
  "Service",
  "Product",
  "Appointment",
  "Coupon",
  "Package",
  "Staff",
] as const;

interface PageProps {
  searchParams: Promise<{ cursor?: string; entity?: string }>;
}

/**
 * Admin audit log viewer.
 *
 * Why server-rendered filter chips:
 * The chips are plain `<Link>`s that update `?entity=` — Next.js re-runs this
 * Server Component with the new search params and streams fresh HTML. No
 * client state, no fetch-on-filter, and the URL is shareable.
 *
 * Why expandable rows instead of a detail route:
 * A separate `/admin/audit-logs/[id]` route would mean a navigation per
 * inspection. The `oldData` / `newData` payload is already in the list row, so
 * a click-to-expand toggle in a client island gives the same UX without the
 * round trip.
 */
export default async function AdminAuditLogsPage({ searchParams }: PageProps) {
  const user = await getSession();
  if (!user || user.role !== "SUPER_ADMIN") return null;

  const search = await searchParams;
  const cursor =
    search.cursor && isResourceId(search.cursor) ? search.cursor : undefined;
  // The schema accepts any 1–64-char string for `entity`; we pass it through
  // unchanged so a future entity type works without a code change here.
  const entity = search.entity?.trim() || undefined;

  const result = await listLogs(user.role, { limit: 50, cursor, entity });

  // Server `PublicAuditLog.createdAt` is a Date; the client mirror types it
  // as an ISO string. Convert at the RSC boundary.
  const logs: PublicAuditLog[] = result.items.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold">Audit logs</h1>
        <p className="mt-2 text-muted-foreground">
          Every platform write and admin action, newest first.
        </p>
      </header>

      <EntityFilterChips activeEntity={entity} />

      <AuditLogTable logs={logs} />

      <Pagination
        hasMore={result.hasMore}
        nextCursor={result.nextCursor}
        buildHref={(next) => {
          const params = new URLSearchParams();
          if (entity) params.set("entity", entity);
          params.set("cursor", next);
          return `${routes.adminAuditLogs}?${params.toString()}`;
        }}
      />
    </div>
  );
}

/** Server-rendered filter chips for the entity column. */
function EntityFilterChips({
  activeEntity,
}: {
  activeEntity: string | undefined;
}) {
  const base = routes.adminAuditLogs;
  return (
    <nav
      aria-label="Filter audit logs by entity type"
      className="flex flex-wrap gap-2"
    >
      <Link
        href={base}
        aria-current={activeEntity === undefined ? "page" : undefined}
        className={chipClass(activeEntity === undefined)}
      >
        All
      </Link>
      {ENTITY_FILTERS.map((value) => (
        <Link
          key={value}
          href={`${base}?entity=${encodeURIComponent(value)}`}
          aria-current={activeEntity === value ? "page" : undefined}
          className={chipClass(activeEntity === value)}
        >
          {value}
        </Link>
      ))}
    </nav>
  );
}

/** Chip class — active chip is filled, inactive chip is outline. */
function chipClass(active: boolean): string {
  return active
    ? "inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground"
    : "inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground";
}
