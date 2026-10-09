import { UsersRound } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import {
  getSchedule,
  listLeaves,
} from "@/server/modules/staff/staff.service";
import type { DayOfWeek } from "@/generated/prisma/client";

import type { PublicScheduleDay, PublicStaffMember } from "./types";

interface StaffListProps {
  /** Staff members returned by `listStaff` — without schedule / leave enrichment. */
  staff: PublicStaffMember[];
  salonSlug: string;
  /** The caller's user id — needed to authorize the per-row schedule / leave reads. */
  viewerId: string;
}

/**
 * One staff row enriched with its weekly schedule + leave count.
 *
 * Why we fetch this server-side rather than in the client:
 * `getSchedule` and `listLeaves` are `server-only` services — the client
 * would have to round-trip the API for every row. Doing the parallel fetch
 * here keeps the page render at one inbound HTTP request + N small Prisma
 * reads, and avoids shipping the schedule payload to the browser twice
 * (the detail page re-fetches it anyway).
 */
interface StaffRow {
  member: PublicStaffMember;
  schedule: PublicScheduleDay[];
  leavesCount: number;
  leavesHasMore: boolean;
}

/**
 * Salon-side staff directory — mobile cards + desktop table.
 *
 * Why a Server Component (no "use client"):
 * The data needs the auth context (`viewerId` drives the schedule / leave
 * reads), and there are no inline interactions on the rows themselves —
 * every action is a `<Link>` to the detail page. Stays crawlable and renders
 * without JS.
 *
 * Why the per-row enrichment lives here (and not the page):
 * The page already runs `getSalonForServiceManagement` + `listStaff`. Pushing
 * the schedule / leaves reads into this component keeps the page logic linear
 * ("load salon, load staff, render list") and lets this component own the
 * visual contract of the summary text — the same module decides "Mon–Sat,
 * 09:00–18:00" and renders it.
 *
 * Why every per-row fetch is wrapped in its own try/catch:
 * If a staff row is deleted between `listStaff` and `getSchedule`, the
 * service throws `StaffNotFoundError`. We render the row with an "Unknown"
 * summary instead of letting one missing row 500 the whole page.
 */
export async function StaffList({
  staff,
  salonSlug,
  viewerId,
}: StaffListProps) {
  if (staff.length === 0) {
    return (
      <EmptyState
        icon={UsersRound}
        title="No team members yet."
        description="Add stylists and managers from the salon members screen — they'll appear here once they're part of your salon."
      />
    );
  }

  const rows: StaffRow[] = await Promise.all(
    staff.map(async (member) => {
      try {
        const [schedule, leaves] = await Promise.all([
          getSchedule(viewerId, salonSlug, member.id),
          listLeaves(viewerId, salonSlug, member.id),
        ]);
        return {
          member,
          schedule,
          leavesCount: leaves.items.length,
          leavesHasMore: leaves.hasMore,
        };
      } catch {
        return {
          member,
          schedule: [],
          leavesCount: 0,
          leavesHasMore: false,
        };
      }
    }),
  );

  return (
    <>
      {/* Mobile / tablet: stacked cards */}
      <ul className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <StaffCard key={row.member.id} row={row} salonSlug={salonSlug} />
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border lg:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Name
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Role
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Schedule
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Leaves
              </th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <StaffRowComponent
                key={row.member.id}
                row={row}
                salonSlug={salonSlug}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Mobile-friendly card for one staff member. */
function StaffCard({
  row,
  salonSlug,
}: {
  row: StaffRow;
  salonSlug: string;
}) {
  const name = row.member.user.name ?? "Unnamed member";
  const initial = (row.member.user.name?.trim()[0] ?? "?").toUpperCase();
  const href = routes.salonStaffDetail(salonSlug, row.member.id);

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar>
            {row.member.user.avatar ? (
              <AvatarImage
                src={row.member.user.avatar}
                alt={name}
              />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium leading-tight">{name}</p>
            {row.member.user.email ? (
              <p className="truncate text-xs text-muted-foreground">
                {row.member.user.email}
              </p>
            ) : null}
          </div>
        </div>
        <RoleBadge role={row.member.role} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Schedule
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {summarizeSchedule(row.schedule)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Leaves
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {summarizeLeaves(row.leavesCount, row.leavesHasMore)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={href} />}
          aria-label={`Manage ${name}`}
        >
          Manage
        </Button>
      </div>
    </li>
  );
}

/** Table row for one staff member (desktop). */
function StaffRowComponent({
  row,
  salonSlug,
}: {
  row: StaffRow;
  salonSlug: string;
}) {
  const name = row.member.user.name ?? "Unnamed member";
  const initial = (row.member.user.name?.trim()[0] ?? "?").toUpperCase();
  const href = routes.salonStaffDetail(salonSlug, row.member.id);

  return (
    <tr className="hover:bg-muted/40">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {row.member.user.avatar ? (
              <AvatarImage
                src={row.member.user.avatar}
                alt={name}
              />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium leading-tight">{name}</p>
            {row.member.user.email ? (
              <p className="truncate text-xs text-muted-foreground">
                {row.member.user.email}
              </p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <RoleBadge role={row.member.role} />
      </td>
      <td className="px-4 py-3 align-middle text-muted-foreground">
        {summarizeSchedule(row.schedule)}
      </td>
      <td className="px-4 py-3 align-middle text-muted-foreground">
        {summarizeLeaves(row.leavesCount, row.leavesHasMore)}
      </td>
      <td className="px-4 py-3 text-right align-middle">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={href} />}
          aria-label={`Manage ${name}`}
        >
          Manage
        </Button>
      </td>
    </tr>
  );
}

/** Pill coloured by salon role so the hierarchy reads at a glance. */
function RoleBadge({ role }: { role: PublicStaffMember["role"] }) {
  const variant =
    role === "OWNER"
      ? "default"
      : role === "MANAGER"
        ? "secondary"
        : "outline";
  const label =
    role === "OWNER" ? "Owner" : role === "MANAGER" ? "Manager" : "Staff";
  return (
    <Badge variant={variant} className={cn("uppercase")}>
      {label}
    </Badge>
  );
}

/**
 * Renders a one-line summary of a weekly schedule.
 *
 * Why we don't list every day:
 * A 7-row grid is heavy for a list summary. The summary conveys the two
 * things an owner scans for — "is this person part-time?" (working-days
 * count) and "what are their typical hours?" (the first working day's
 * window) — and defers the full breakdown to the detail page.
 */
function summarizeSchedule(schedule: PublicScheduleDay[]): string {
  if (schedule.length === 0) return "Not set";
  const ordered = orderDays(schedule);
  const working = ordered.filter((day) => !day.isOff);
  if (working.length === 0) return "Off all week";

  const dayCount = working.length;
  const sample = working[0];
  if (!sample.startTime || !sample.endTime) {
    return `${dayCount} day${dayCount === 1 ? "" : "s"}/week`;
  }
  const window = `${formatTime12h(sample.startTime)}–${formatTime12h(sample.endTime)}`;
  return `${dayCount} day${dayCount === 1 ? "" : "s"}/week · ${window}`;
}

/** Renders "0" / "1 leave" / "3 leaves" / "50+ leaves" for a staff row. */
function summarizeLeaves(count: number, hasMore: boolean): string {
  if (count === 0) return "None";
  const suffix = hasMore ? "+" : "";
  const noun = count === 1 ? "leave" : "leaves";
  return `${count}${suffix} ${noun}`;
}

/** Stable Monday-first ordering for the schedule summary. */
const DAY_ORDER: Record<DayOfWeek, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

function orderDays(days: PublicScheduleDay[]): PublicScheduleDay[] {
  return [...days].sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day]);
}

/** Converts a 24-hour "HH:mm" string to a 12-hour "h:mm AM/PM" string. */
function formatTime12h(value: string): string {
  const [hhStr, mmStr] = value.split(":");
  const hh = Number(hhStr);
  const mm = mmStr ?? "00";
  if (!Number.isFinite(hh)) return value;
  const period = hh >= 12 ? "PM" : "AM";
  const displayHour = hh % 12 === 0 ? 12 : hh % 12;
  return `${displayHour}:${mm} ${period}`;
}
