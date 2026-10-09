import { siteConfig } from "@/config/site";

export const appointmentPriceFormatter = new Intl.NumberFormat(
  siteConfig.locale,
  { style: "currency", currency: siteConfig.currency },
);

/** Formats an appointment instant in the salon's local timezone. */
export function formatAppointmentDateTime(
  value: string | Date,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(siteConfig.locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}

/**
 * Formats just the date of an appointment instant in the salon's timezone
 * (e.g. "15 Jan 2025").
 *
 * Why a separate helper:
 * The salon-side manage view shows today's appointments — the date is
 * already in the page header ("Today · 15 Jan 2025"), so repeating it on
 * every row would be noise. The page header uses this helper for the date
 * line and the rows use {@link formatAppointmentTime} for the time.
 */
export function formatAppointmentDate(
  value: string | Date,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(siteConfig.locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}

/**
 * Formats just the time of an appointment instant in the salon's timezone
 * (e.g. "2:30 PM").
 *
 * Why a separate helper:
 * On the salon-side manage list, every row is for the same day — only the
 * time differentiates them. Repeating the date on each row would push the
 * status and price below the fold on a phone. See
 * {@link formatAppointmentDate} for the matching date-only helper.
 */
export function formatAppointmentTime(
  value: string | Date,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(siteConfig.locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(new Date(value));
}
