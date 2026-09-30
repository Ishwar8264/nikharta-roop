import { Clock3 } from "lucide-react";

import type {
  SalonWorkingHour,
} from "@/server/modules/salon/salon.types";

const DAY_LABELS: Record<SalonWorkingHour["day"], string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const JS_DAY_TO_DAY = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const satisfies readonly SalonWorkingHour["day"][];

interface SalonWorkingHoursProps {
  hours: SalonWorkingHour[];
  timezone: string;
}

/** Renders weekly opening hours and a timezone-aware current status. */
export function SalonWorkingHours({
  hours,
  timezone,
}: SalonWorkingHoursProps) {
  const openNow = isSalonOpenNow(hours, timezone);

  return (
    <section
      className="rounded-xl border border-border bg-card p-5"
      aria-labelledby="working-hours-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="working-hours-title"
          className="flex items-center gap-2 font-heading text-base font-semibold"
        >
          <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
          Working hours
        </h2>
        {hours.length > 0 ? (
          <span
            className={
              openNow
                ? "text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                : "text-xs font-semibold text-muted-foreground"
            }
          >
            {openNow ? "Open now" : "Closed now"}
          </span>
        ) : null}
      </div>

      {hours.length > 0 ? (
        <dl className="mt-4 space-y-2.5 text-sm">
          {hours.map((entry) => (
            <div key={entry.day} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{DAY_LABELS[entry.day]}</dt>
              <dd className="text-right font-medium">
                {entry.isClosed
                  ? "Closed"
                  : `${formatTime(entry.openTime)}–${formatTime(entry.closeTime)}`}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Opening hours are not available yet.
        </p>
      )}
    </section>
  );
}

/** Returns whether the salon is open at an instant in its configured timezone. */
export function isSalonOpenNow(
  hours: SalonWorkingHour[],
  timezone: string,
  now = new Date(),
): boolean {
  let parts: Intl.DateTimeFormatPart[];

  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return false;
  }

  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  const jsDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekday ?? "",
  );

  if (jsDay < 0 || !Number.isFinite(hour) || !Number.isFinite(minute)) {
    return false;
  }

  const currentMinutes = hour * 60 + minute;
  const today = JS_DAY_TO_DAY[jsDay];
  const yesterday = JS_DAY_TO_DAY[(jsDay + 6) % 7];
  const todayHours = hours.find((entry) => entry.day === today);
  const yesterdayHours = hours.find((entry) => entry.day === yesterday);

  return (
    isOpenDuringDay(todayHours, currentMinutes) ||
    isOpenAfterMidnight(yesterdayHours, currentMinutes)
  );
}

function isOpenDuringDay(
  entry: SalonWorkingHour | undefined,
  currentMinutes: number,
): boolean {
  if (!entry || entry.isClosed) return false;
  const opens = toMinutes(entry.openTime);
  const closes = toMinutes(entry.closeTime);
  if (opens === null || closes === null) return false;

  return opens <= closes
    ? currentMinutes >= opens && currentMinutes < closes
    : currentMinutes >= opens;
}

function isOpenAfterMidnight(
  entry: SalonWorkingHour | undefined,
  currentMinutes: number,
): boolean {
  if (!entry || entry.isClosed) return false;
  const opens = toMinutes(entry.openTime);
  const closes = toMinutes(entry.closeTime);
  if (opens === null || closes === null || opens <= closes) return false;
  return currentMinutes < closes;
}

function toMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatTime(value: string): string {
  const minutes = toMinutes(value);
  if (minutes === null) return value;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const displayHour = hour % 12 || 12;
  const suffix = hour < 12 ? "am" : "pm";
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}
