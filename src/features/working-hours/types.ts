/**
 * Browser-safe mirror of `src/server/modules/salon-working-hours/working-hours.types.ts`.
 *
 * Why a copy and not an import:
 * Server modules may be marked `server-only`. Mirroring the public shape here
 * keeps the Client Component free of `src/server/**` imports while still giving
 * the form a single typed contract with the API.
 */
export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

/** Public shape of one day of a salon's weekly hours (matches the API). */
export interface PublicWorkingHours {
  id: string;
  day: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/** Body for the PUT /salons/{ref}/working-hours endpoint. */
export interface ReplaceWorkingHoursBody {
  days: Array<{
    day: DayOfWeek;
    /** "HH:mm" — required when `isClosed` is false. */
    openTime?: string;
    /** "HH:mm" — required when `isClosed` is false. */
    closeTime?: string;
    isClosed: boolean;
  }>;
}

/** API response envelope returned by both GET and PUT. */
export interface WorkingHoursResponse {
  message: string;
  data: { hours: PublicWorkingHours[] };
}
