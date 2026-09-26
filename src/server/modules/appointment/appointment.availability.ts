import "server-only";

import type { DayOfWeek } from "@/generated/prisma/client";

import type { AvailabilitySlot } from "./appointment.types";

/** Slot granularity in minutes. */
const SLOT_STEP_MINUTES = 30;

/** Map DayOfWeek enum to JS getDay() (0=Sunday). */
const DAY_TO_JS_INDEX: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** "HH:mm" → minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** Minutes since midnight → "HH:mm". */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Returns the DayOfWeek enum for a given YYYY-MM-DD in the target timezone. */
export function getDayOfWeek(date: string): DayOfWeek {
  const [year, month, day] = date.split("-").map(Number);
  // Construct a UTC date so the day-of-week is stable regardless of server TZ.
  const utc = new Date(Date.UTC(year!, (month ?? 1) - 1, day ?? 1));
  const jsIndex = utc.getUTCDay();
  return (Object.entries(DAY_TO_JS_INDEX).find(
    ([, index]) => index === jsIndex,
  )?.[0] ?? "MONDAY") as DayOfWeek;
}

interface BusyInterval {
  startMinutes: number;
  endMinutes: number;
}

interface ComputeSlotsInput {
  date: string;
  /** Working hours for that day; null when the salon is closed. */
  salon: { openTime: string; closeTime: string } | null;
  /** Staff scheduled hours for that day; null when off. */
  staff: { startTime: string; endTime: string } | null;
  /** True when an approved leave covers the full day. */
  staffOnLeave: boolean;
  /** Total duration of all requested services, in minutes. */
  totalDurationMinutes: number;
  /** Existing appointments for this staff on this date (minutes-since-midnight). */
  busy: BusyInterval[];
  /** Current time in the salon's local timezone — past slots are excluded. */
  now: { date: string; minutesSinceMidnight: number };
}

/**
 * Computes bookable start-time slots for a given day.
 *
 * Why:
 * Availability is the intersection of four calendars — salon hours, staff
 * schedule, approved leaves, and existing bookings. Computing it here keeps
 * the booking endpoint itself thin and lets both the availability endpoint
 * and the create flow share the same rules.
 */
export function computeAvailableSlots(
  input: ComputeSlotsInput,
): AvailabilitySlot[] {
  if (!input.salon || !input.staff || input.staffOnLeave) return [];

  const windowStart = Math.max(
    timeToMinutes(input.salon.openTime),
    timeToMinutes(input.staff.startTime),
  );
  const windowEnd = Math.min(
    timeToMinutes(input.salon.closeTime),
    timeToMinutes(input.staff.endTime),
  );

  if (windowEnd <= windowStart) return [];
  if (windowEnd - windowStart < input.totalDurationMinutes) return [];

  const busy = [...input.busy].sort((a, b) => a.startMinutes - b.startMinutes);
  const isToday = input.now.date === input.date;
  const nowMinutes = isToday ? input.now.minutesSinceMidnight : -1;

  const slots: AvailabilitySlot[] = [];

  for (
    let start = windowStart;
    start + input.totalDurationMinutes <= windowEnd;
    start += SLOT_STEP_MINUTES
  ) {
    const end = start + input.totalDurationMinutes;

    // Skip slots that have already started today.
    if (nowMinutes >= 0 && start <= nowMinutes) continue;

    // Skip if the window overlaps any existing booking.
    const conflict = busy.some(
      (b) => b.startMinutes < end && b.endMinutes > start,
    );
    if (conflict) continue;

    slots.push({
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
    });
  }

  return slots;
}

/**
 * Builds a Date from a YYYY-MM-DD + "HH:mm" interpreted in a given timezone.
 *
 * Why:
 * The booking data lives in UTC but the salon operates in a local timezone.
 * We only support a fixed offset per call (Asia/Kolkata = +05:30) to avoid a
 * heavy TZ library; extend later when multi-timezone is needed.
 */
export function buildLocalDateTime(
  date: string,
  time: string,
  timezoneOffsetMinutes: number,
): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const utcMs = Date.UTC(
    year!,
    (month ?? 1) - 1,
    day ?? 1,
    hours ?? 0,
    minutes ?? 0,
  );
  return new Date(utcMs - timezoneOffsetMinutes * 60 * 1000);
}

/** Fixed offset (minutes) for a small set of supported timezones. */
export function timezoneOffsetMinutes(timezone: string): number {
  const map: Record<string, number> = {
    "Asia/Kolkata": 330,
    "Asia/Dubai": 240,
    "Asia/Singapore": 480,
    "Europe/London": 0,
    "America/New_York": -300,
    UTC: 0,
  };
  return map[timezone] ?? 0;
}

/** Extracts YYYY-MM-DD in a given timezone from a Date. */
export function toLocalDateString(
  instant: Date,
  timezoneOffsetMin: number,
): string {
  const local = new Date(instant.getTime() + timezoneOffsetMin * 60 * 1000);
  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, "0");
  const day = String(local.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Extracts minutes-since-midnight in a given timezone from a Date. */
export function toLocalMinutesSinceMidnight(
  instant: Date,
  timezoneOffsetMin: number,
): number {
  const local = new Date(instant.getTime() + timezoneOffsetMin * 60 * 1000);
  return local.getUTCHours() * 60 + local.getUTCMinutes();
}
