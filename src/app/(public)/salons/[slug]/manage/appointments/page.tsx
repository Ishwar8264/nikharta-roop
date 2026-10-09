import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { SalonAppointmentList } from "@/features/appointment/components/salon-appointment-list";
import { listSalonAppointmentsServer } from "@/features/appointment/api.server";
import { formatAppointmentDate } from "@/features/appointment/format";
import type { AppointmentStatus } from "@/features/appointment/types";
import { getSession } from "@/lib/auth/get-session";
import {
  timezoneOffsetMinutes,
  toLocalDateString,
} from "@/server/modules/appointment/appointment.availability";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

export const metadata: Metadata = {
  title: "Manage appointments | Nikharta Roop",
  description:
    "Today's appointments at your salon — filter by status, view customer details, and jump to the appointment detail to record payments.",
};

/**
 * Statuses the salon-side filter chips can show. Excludes RESCHEDULED —
 * the rescheduled appointment is terminal and the new booking supersedes
 * it, so the owner filters by the new booking's status instead.
 */
const STATUS_FILTERS: readonly AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

const STATUS_FILTER_SET: ReadonlySet<AppointmentStatus> = new Set(
  STATUS_FILTERS,
);

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
  RESCHEDULED: "Rescheduled",
};

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    cursor?: string;
    status?: string;
    from?: string;
    to?: string;
  }>;
}

/**
 * Salon-side "today" cockpit — the manage-appointments page.
 *
 * Why default to today's bounds in the salon's local timezone:
 * A salon owner opening this page is almost always answering "who is in the
 * chair today?". Defaulting `from`/`to` to today in the salon's local TZ
 * gives them the answer in one tap. The status chips preserve the date
 * window; the cursor link preserves both. A future feature can add a date
 * picker by writing `from`/`to` into searchParams without touching this
 * page's logic.
 *
 * Why the salon load happens before the list load:
 * `listSalonAppointmentsServer` accepts `from`/`to` as ISO datetime strings
 * with explicit offset. We need `salon.timezone` to compute today's bounds
 * (Asia/Kolkata → +05:30, Asia/Dubai → +04:00, etc.), so the salon row has
 * to be in hand first. The latency cost is one extra awaited call in the
 * same Node process (~1–5 ms typical); the salon service also runs the
 * MANAGER+ access check, so the subsequent list call is already authorized.
 *
 * Why server-rendered filter chips:
 * The chips are plain `<Link>`s that update `searchParams`. No client JS
 * runs to filter the list — Next.js re-runs this Server Component with the
 * new search params and streams fresh HTML. The whole page is crawlable
 * and works without JS, matching the existing customer appointments list.
 */
export default async function ManageSalonAppointmentsPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, search] = await Promise.all([params, searchParams]);

  // Validate cursor early — a malformed cursor means the link was
  // hand-edited; ignoring it keeps the URL shape honest without a 404.
  const cursor =
    search.cursor && isResourceId(search.cursor) ? search.cursor : undefined;

  // Validate status — only the six filterable statuses are accepted; an
  // unknown value drops back to "no filter".
  const status: AppointmentStatus | undefined = (() => {
    if (!search.status) return undefined;
    return STATUS_FILTER_SET.has(search.status as AppointmentStatus)
      ? (search.status as AppointmentStatus)
      : undefined;
  })();

  // from / to: optional ISO datetime strings with offset. If either fails
  // to parse, ignore it (the default below takes over).
  const fromParam =
    search.from && Number.isFinite(Date.parse(search.from))
      ? search.from
      : undefined;
  const toParam =
    search.to && Number.isFinite(Date.parse(search.to)) ? search.to : undefined;

  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonAppointmentsManage(slug))}`,
    );
  }

  // Salon guard — authorizes the page. Throws typed errors the catch below
  // maps to notFound(); everything else rethrows so the route-level error
  // boundary reports a real failure instead of a 404.
  let salon: Awaited<ReturnType<typeof getSalonForServiceManagement>>;
  try {
    salon = await getSalonForServiceManagement(slug, user.id);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  // Compute today's bounds in the salon's local timezone. `from`/`to` from
  // the URL override the defaults — a future date-picker would just write
  // those two params.
  const salonOffset = timezoneOffsetMinutes(salon.timezone || "Asia/Kolkata");
  const todayStr = toLocalDateString(new Date(), salonOffset);
  const todayFrom = toIsoDateTimeWithOffset(todayStr, 0, 0, 0, salonOffset);
  const todayTo = toIsoDateTimeWithOffset(todayStr, 23, 59, 59, salonOffset);

  const result = await listSalonAppointmentsServer(slug, {
    cursor,
    status,
    from: fromParam ?? todayFrom,
    to: toParam ?? todayTo,
    limit: 50,
  });

  // The list call can return null on a rare race (access revoked between the
  // guard and the list). Render the empty state in that case so the page
  // never throws a 500 on the salon owner.
  const items = result?.items ?? [];
  const hasMore = result?.hasMore ?? false;
  const nextCursor = result?.nextCursor ?? null;

  // Today's date instant (in the salon's TZ) for the header label.
  const todayDate = new Date(`${todayStr}T00:00:00${formatOffset(salonOffset)}`);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Appointments</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {salon.name} · Today{" "}
              {formatAppointmentDate(todayDate, salon.timezone)}
            </p>
          </div>
        </div>
      </header>

      <StatusFilterChips slug={slug} status={status} />

      <section className="mt-6">
        <SalonAppointmentList salonSlug={slug} appointments={items} />
      </section>

      {hasMore && nextCursor ? (
        <div className="mt-8 flex justify-center">
          <Link
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-border bg-background px-3.5 text-sm hover:bg-muted"
            href={`${routes.salonAppointmentsManage(slug)}?${buildQuery({
              ...(status ? { status } : {}),
              ...(fromParam ? { from: fromParam } : {}),
              ...(toParam ? { to: toParam } : {}),
              cursor: nextCursor,
            }).toString()}`}
          >
            View more
          </Link>
        </div>
      ) : null}
    </main>
  );
}

/** Renders the All / SCHEDULED / ... filter chip row as server-side Links. */
function StatusFilterChips({
  slug,
  status,
}: {
  slug: string;
  status: AppointmentStatus | undefined;
}) {
  const base = routes.salonAppointmentsManage(slug);
  return (
    <nav
      aria-label="Filter appointments by status"
      className="mt-6 flex flex-wrap gap-2"
    >
      <Link
        href={base}
        aria-current={status === undefined ? "page" : undefined}
        className={chipClass(status === undefined)}
      >
        All
      </Link>
      {STATUS_FILTERS.map((value) => (
        <Link
          key={value}
          href={`${base}?status=${value}`}
          aria-current={status === value ? "page" : undefined}
          className={chipClass(status === value)}
        >
          {STATUS_LABELS[value]}
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

/** Builds a URLSearchParams from a flat record, skipping undefined values. */
function buildQuery(
  input: Record<string, string | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) params.set(key, value);
  }
  return params;
}

/**
 * Builds an ISO 8601 datetime string with an explicit offset.
 *
 * Why explicit offset instead of "Z":
 * `new Date("2024-01-15T00:00:00+05:30")` parses to the correct UTC instant
 * regardless of the server's TZ. The Prisma `startTime` column stores UTC,
 * so the comparison `startTime >= {from}` lands on the right rows even
 * when the salon's local day starts 5.5 hours earlier than the server's.
 *
 * This helper is a local copy of the one in `salon-stats.service.ts` — the
 * alternative would be to export it from a shared module, but that would
 * touch a file outside this task's scope. The duplication is ~10 lines of
 * pure date math, no behaviour to drift.
 */
function toIsoDateTimeWithOffset(
  ymd: string,
  hours: number,
  minutes: number,
  seconds: number,
  offsetMin: number,
): string {
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${ymd}T${hh}:${mm}:${ss}${formatOffset(offsetMin)}`;
}

/** Formats a minutes offset as ±HH:MM for an ISO datetime string. */
function formatOffset(offsetMin: number): string {
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}
