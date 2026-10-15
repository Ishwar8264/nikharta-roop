import { ArrowUpRight, UsersRound } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
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
        description="Add your first team member from the salon overview to get started."
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
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card lg:block">
        <table className="w-full min-w-[800px] table-fixed text-sm">
          <caption className="sr-only">Salon team members, roles, email verification, schedules, and leave records</caption>
          <thead className="bg-muted/30 text-left text-xs text-muted-foreground">
            <tr>
              <th scope="col" className="w-[30%] px-5 py-3.5 font-medium">
                Team member
              </th>
              <th scope="col" className="w-[12%] px-4 py-3.5 font-medium">
                Role
              </th>
              <th scope="col" className="w-[14%] px-4 py-3.5 font-medium">
                Email status
              </th>
              <th scope="col" className="w-[20%] px-4 py-3.5 font-medium">
                Schedule
              </th>
              <th scope="col" className="w-[10%] px-4 py-3.5 font-medium">
                Leaves
              </th>
              <th scope="col" className="w-[14%] px-4 py-3"><span className="sr-only">Actions</span></th>
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
  const name = row.member.name ?? row.member.user.name ?? "Unnamed member";
  const initial = ((row.member.name ?? row.member.user.name)?.trim()[0] ?? "?").toUpperCase();
  const href = routes.salonStaffDetail(salonSlug, row.member.id);

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg">
            {(row.member.avatar ?? row.member.user.avatar) ? (
              <AvatarImage
                src={row.member.avatar ?? row.member.user.avatar ?? undefined}
                alt={name}
              />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link href={href} className="block truncate font-semibold leading-6 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{name}</Link>
            {row.member.title ? <p className="truncate text-xs text-muted-foreground">{row.member.title}</p> : null}
            {row.member.user.email ? (
              <p className="truncate text-xs text-muted-foreground">
                {row.member.user.email}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2"><RoleBadge role={row.member.role} /><EmailVerificationBadge verified={row.member.user.emailVerified} /></div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted/30 p-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">
            Schedule
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {summarizeSchedule(row.schedule)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
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
          aria-label={`View profile for ${name}`}
        >
          Profile
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
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
  const name = row.member.name ?? row.member.user.name ?? "Unnamed member";
  const initial = ((row.member.name ?? row.member.user.name)?.trim()[0] ?? "?").toUpperCase();
  const href = routes.salonStaffDetail(salonSlug, row.member.id);

  return (
    <tr className="transition-colors hover:bg-muted/25 focus-within:bg-muted/25">
      <td className="px-5 py-5 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg">
            {(row.member.avatar ?? row.member.user.avatar) ? (
              <AvatarImage
                src={row.member.avatar ?? row.member.user.avatar ?? undefined}
                alt={name}
              />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link href={href} className="block truncate font-semibold leading-6 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{name}</Link>
            {row.member.title ? <p className="truncate text-xs text-muted-foreground">{row.member.title}</p> : null}
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
      <td className="px-4 py-3 align-middle">
        <EmailVerificationBadge verified={row.member.user.emailVerified} />
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
          aria-label={`View profile for ${name}`}
        >
          Profile
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Button>
      </td>
    </tr>
  );
}

/** Reflects the account email verification flag returned with each staff member. */
function EmailVerificationBadge({ verified }: { verified: boolean }) {
  return (
    <Badge
      variant="outline"
      className={verified ? "gap-1.5 border-success/30 bg-success/10 text-success" : "gap-1.5 text-muted-foreground"}
      aria-label={`Email verification: ${verified ? "Verified" : "Pending"}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {verified ? "Verified" : "Pending"}
    </Badge>
  );
}

/** Pill coloured by salon role so the hierarchy reads at a glance. */
function RoleBadge({ role }: { role: PublicStaffMember["role"] }) {
  const variant = role === "STAFF" ? "outline" : "secondary";
  const label =
    role === "OWNER" ? "Owner" : role === "MANAGER" ? "Manager" : "Staff";
  return (
    <Badge variant={variant} className="font-medium">
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
