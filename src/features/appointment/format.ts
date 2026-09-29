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
