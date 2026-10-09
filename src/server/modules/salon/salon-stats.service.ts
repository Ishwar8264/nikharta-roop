import "server-only";

import {
  timezoneOffsetMinutes,
  toLocalDateString,
} from "@/server/modules/appointment/appointment.availability";
import { listAppointmentsForSalon } from "@/server/modules/appointment/appointment.service";
import { listSalonPackageCatalog } from "@/server/modules/package/package.service";
import { listSalonServices } from "@/server/modules/service/service.service";
import { SalonVerificationNotFoundError } from "@/server/modules/verification/verification.errors";
import { getSalonVerification } from "@/server/modules/verification/verification.service";

import { findOwnedSalonSummary } from "./salon.service";
import type { SalonOwnerStats } from "./salon-stats.types";

/**
 * Default timezone used when a salon row is missing the `timezone` column.
 *
 * Why hardcoded:
 * The schema column has `@default("Asia/Kolkata")` so every salon row carries
 * a value. This fallback is a defence-in-depth — if a future migration
 * temporarily nulls the column, the stats card still renders in the
 * platform's home timezone instead of throwing on `Intl` lookups.
 */
const DEFAULT_SALON_TIMEZONE = "Asia/Kolkata";

/** Milliseconds per day — used by the ISO-week math. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Returns the at-a-glance stats card payload for the salon the caller owns or
 * manages, or null when the caller is not a salon owner/manager.
 *
 * Why parallel fetches:
 * Five independent reads drive this card — today's appointments, this week's
 * completed appointments (for revenue), the active package count, the active
 * service count, and the verification row. Firing them in `Promise.all`
 * collapses five sequential round-trips into one wave, keeping the dashboard
 * TTFB competitive with the previous ComingSoon placeholder.
 *
 * Why the call signature is `userId` only:
 * The caller (dashboard page) already has the user. The service resolves
 * the owned salon internally via `findOwnedSalonSummary`, so a non-owner
 * gets `null` without any extra plumbing at the call site — and the page
 * doesn't need to thread a salon summary through to a stats helper.
 *
 * Why the appointment-list query caps at limit 100:
 * The stats card only needs "today's appointments" and "this week's
 * completed revenue" — both are bounded by a single day or week. 100 is
 * well above the realistic max for one salon; if a salon ever exceeds it,
 * the card quietly under-counts rather than paging the API server-side.
 * The same cap is applied to the services and packages catalogues for
 * consistency; neither realistically exceeds 100 active rows.
 *
 * Why the verification catch is narrow:
 * `getSalonVerification` throws `SalonVerificationNotFoundError` for salons
 * that have never submitted — the dashboard treats that as the "pending"
 * onboarding state. Any other error is rethrown so the page surfaces a
 * real failure instead of silently misreporting verification status.
 */
export async function getSalonOwnerStats(
  userId: string,
): Promise<SalonOwnerStats | null> {
  const salon = await findOwnedSalonSummary(userId);
  if (!salon) return null;

  const timezone = salon.timezone || DEFAULT_SALON_TIMEZONE;
  const offsetMin = timezoneOffsetMinutes(timezone);

  const now = new Date();
  const todayStr = toLocalDateString(now, offsetMin);
  const { weekStartDate, weekEndDate } = computeIsoWeekBounds(now, offsetMin);

  // Build ISO datetime strings with an explicit offset so Prisma compares
  // against UTC-stored startTime correctly regardless of the server's TZ.
  const todayFromIso = toIsoDateTimeWithOffset(todayStr, 0, 0, 0, offsetMin);
  const todayToIso = toIsoDateTimeWithOffset(todayStr, 23, 59, 59, offsetMin);
  const weekFromIso = toIsoDateTimeWithOffset(weekStartDate, 0, 0, 0, offsetMin);
  const weekToIso = toIsoDateTimeWithOffset(weekEndDate, 23, 59, 59, offsetMin);

  const [todaysAppts, weekCompletedAppts, packages, services, verification] =
    await Promise.all([
      listAppointmentsForSalon(userId, salon.slug, {
        limit: 100,
        from: todayFromIso,
        to: todayToIso,
      }),
      listAppointmentsForSalon(userId, salon.slug, {
        limit: 100,
        status: "COMPLETED",
        from: weekFromIso,
        to: weekToIso,
      }),
      listSalonPackageCatalog(salon.slug, {
        limit: 100,
        includeInactive: false,
      }),
      listSalonServices(salon.slug, {
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
      getSalonVerification(userId, salon.slug).catch((error: unknown) => {
        if (error instanceof SalonVerificationNotFoundError) return null;
        throw error;
      }),
    ]);

  // Today's appointment breakdown by status. The server filter already
  // restricts to today's window, but we double-check the local date string
  // to catch any tz-boundary rows that fall on the previous/next day.
  let upcoming = 0;
  let inProgress = 0;
  let completedToday = 0;
  for (const appt of todaysAppts.items) {
    if (toLocalDateString(appt.startTime, offsetMin) !== todayStr) continue;
    switch (appt.status) {
      case "SCHEDULED":
      case "CONFIRMED":
        if (appt.startTime.getTime() > now.getTime()) upcoming += 1;
        break;
      case "IN_PROGRESS":
        inProgress += 1;
        break;
      case "COMPLETED":
        completedToday += 1;
        break;
      default:
        // CANCELLED, NO_SHOW, RESCHEDULED — none count toward the totals.
        break;
    }
  }

  // Today's "total" = upcoming + in-progress + completed today.
  // Cancelled / no-show / rescheduled rows are excluded by the switch above
  // so the headline number reflects the live appointment ledger.
  const todaysTotal = upcoming + inProgress + completedToday;

  const thisWeekRevenue = weekCompletedAppts.items.reduce(
    (sum, appt) => sum + appt.totalPrice,
    0,
  );

  return {
    salon: {
      id: salon.id,
      slug: salon.slug,
      name: salon.name,
      city: salon.city,
    },
    todaysAppointments: {
      total: todaysTotal,
      upcoming,
      inProgress,
      completed: completedToday,
    },
    thisWeekRevenue,
    pendingVerification:
      verification === null || verification.status === "PENDING",
    activeServices: services.items.length,
    activePackages: packages.items.length,
  };
}

/**
 * Computes the Monday-to-Sunday ISO week window containing `instant`, in the
 * salon's local timezone.
 *
 * Why ISO week (Monday-start):
 * The product spec asks for Mon–Sun. JS `Date.getDay()` returns 0 for Sunday
 * so we shift it to a 0=Monday scale, then walk `instant` back to Monday and
 * forward to Sunday in the salon's offset.
 *
 * Why we anchor on the local date string, not on the UTC instant:
 * Computing "Monday 00:00 in IST" by subtracting N days from a UTC instant
 * would cross day boundaries in either direction. Working from the local
 * YYYY-MM-DD keeps the week window aligned to wall-clock time in the salon's
 * TZ — exactly what an owner sees on their calendar.
 */
function computeIsoWeekBounds(
  instant: Date,
  offsetMin: number,
): { weekStartDate: string; weekEndDate: string } {
  const todayStr = toLocalDateString(instant, offsetMin);
  const [yStr, mStr, dStr] = todayStr.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  // Build a UTC date so getUTCDay is stable regardless of the server's TZ.
  const todayUtc = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  const jsDay = todayUtc.getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  // Shift so 0=Monday ... 6=Sunday.
  const mondayOffsetDays = jsDay === 0 ? 6 : jsDay - 1;
  const mondayUtcMs = todayUtc.getTime() - mondayOffsetDays * MS_PER_DAY;
  const sundayUtcMs = mondayUtcMs + 6 * MS_PER_DAY;
  return {
    weekStartDate: formatUtcAsYmd(new Date(mondayUtcMs)),
    weekEndDate: formatUtcAsYmd(new Date(sundayUtcMs)),
  };
}

/** Formats a UTC instant as YYYY-MM-DD using its UTC components. */
function formatUtcAsYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Builds an ISO 8601 datetime string with an explicit offset.
 *
 * Why explicit offset instead of "Z":
 * `new Date("2024-01-15T00:00:00+05:30")` parses to the correct UTC instant
 * regardless of the server's TZ. The Prisma `startTime` column stores UTC,
 * so the comparison `startTime >= {from}` lands on the right rows even
 * when the salon's local day starts 5.5 hours earlier than the server's.
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
