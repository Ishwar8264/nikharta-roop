import { describe, expect, it } from "vitest";

/**
 * `appointment.availability.ts` is a small pure module: its only runtime
 * import is the `server-only` marker (stubbed in `vitest.config.ts`). The
 * Prisma + DayOfWeek imports are type-only and stripped at transpile time,
 * so no `vi.mock` is needed here.
 */
import {
  computeAvailableSlots,
  minutesToTime,
  timeToMinutes,
} from "../src/server/modules/appointment/appointment.availability";

describe("timeToMinutes / minutesToTime", () => {
  it("parses HH:mm into minutes since midnight", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("formats minutes since midnight back to HH:mm", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(570)).toBe("09:30");
    expect(minutesToTime(1439)).toBe("23:59");
  });

  it("round-trips through both helpers", () => {
    expect(minutesToTime(timeToMinutes("14:45"))).toBe("14:45");
  });
});

describe("computeAvailableSlots", () => {
  // Build a baseline input that yields a full open day with no bookings —
  // each test tweaks the field it cares about. Plain object (no `as const`)
  // so the inferred types widen to the mutable shapes the function expects.
  const baseInput = {
    date: "2024-06-15",
    salon: { openTime: "09:00", closeTime: "17:00" },
    staff: { startTime: "09:00", endTime: "17:00" },
    staffOnLeave: false,
    totalDurationMinutes: 60,
    busy: [] as { startMinutes: number; endMinutes: number }[],
    bufferMinutes: 0,
    // `now` set to a date far from `date` so no past-slot filtering kicks in.
    now: { date: "2024-01-01", minutesSinceMidnight: 0 },
  };

  describe("empty-window conditions", () => {
    it("returns [] when the salon is closed", () => {
      expect(
        computeAvailableSlots({ ...baseInput, salon: null }),
      ).toEqual([]);
    });

    it("returns [] when the staff is not scheduled", () => {
      expect(
        computeAvailableSlots({ ...baseInput, staff: null }),
      ).toEqual([]);
    });

    it("returns [] when the staff is on approved leave", () => {
      expect(
        computeAvailableSlots({ ...baseInput, staffOnLeave: true }),
      ).toEqual([]);
    });

    it("returns [] when staff hours and salon hours don't overlap", () => {
      // Salon opens 09–17, staff scheduled 17:30–22:00 → no overlap.
      expect(
        computeAvailableSlots({
          ...baseInput,
          staff: { startTime: "17:30", endTime: "22:00" },
        }),
      ).toEqual([]);
    });

    it("returns [] when the open window is shorter than the service duration", () => {
      expect(
        computeAvailableSlots({
          ...baseInput,
          totalDurationMinutes: 600, // 10h — longer than the 8h open window.
        }),
      ).toEqual([]);
    });
  });

  describe("happy path", () => {
    it("emits 30-minute-slots across the full open window", () => {
      const slots = computeAvailableSlots(baseInput);
      // 09:00 → 17:00 is 8 hours = 480 minutes. 60-min service, 30-min step.
      // First start: 09:00 (end 10:00). Last start: 16:00 (end 17:00).
      // That's (480 - 60) / 30 + 1 = 15 slots.
      expect(slots).toHaveLength(15);
      expect(slots[0]).toEqual({ startTime: "09:00", endTime: "10:00" });
      expect(slots[slots.length - 1]).toEqual({
        startTime: "16:00",
        endTime: "17:00",
      });
    });

    it("respects the intersection of salon and staff hours", () => {
      // Salon 09–17, staff 11–15 → effective window 11:00–15:00 (4h).
      const slots = computeAvailableSlots({
        ...baseInput,
        staff: { startTime: "11:00", endTime: "15:00" },
      });
      // 4h = 240 min; (240 - 60) / 30 + 1 = 7 slots: 11:00, 11:30, …, 14:00.
      expect(slots).toHaveLength(7);
      expect(slots[0].startTime).toBe("11:00");
      expect(slots[slots.length - 1].startTime).toBe("14:00");
    });
  });

  describe("busy intervals", () => {
    it("skips slots that overlap an existing booking", () => {
      // One existing appointment 10:00–11:00 (600–660 min). The overlap test
      // is `b.start < end && b.end > start`, so any candidate whose
      // [start, end) intersects [600, 660) is dropped. That removes 09:30
      // (ends 10:30), 10:00, and 10:30 (ends 11:30). 09:00 ends exactly at
      // 10:00 — no overlap. The next free slot is 11:00.
      const slots = computeAvailableSlots({
        ...baseInput,
        busy: [{ startMinutes: 600, endMinutes: 660 }],
      });
      const starts = slots.map((s) => s.startTime);
      // Three slots are removed (09:30, 10:00, 10:30) — 15 → 12.
      expect(slots).toHaveLength(12);
      expect(starts[0]).toBe("09:00");
      expect(starts[1]).toBe("11:00");
      expect(starts).not.toContain("09:30");
      expect(starts).not.toContain("10:00");
      expect(starts).not.toContain("10:30");
    });

    it("includes a slot whose start exactly equals a booking's end", () => {
      // Booking 09:00–10:00. A 10:00 start with 60-min service ends at 11:00,
      // which does not overlap [09:00, 10:00). Boundary is allowed.
      const slots = computeAvailableSlots({
        ...baseInput,
        busy: [{ startMinutes: 540, endMinutes: 600 }],
      });
      const starts = slots.map((s) => s.startTime);
      expect(starts).toContain("10:00");
    });

    it("extends busy windows by bufferMinutes on both sides", () => {
      // Booking 11:00–12:00 (660–720). A 15-min buffer expands the busy
      // window to [645, 735). Any candidate whose [start, end) intersects
      // that range is dropped — including the 10:00 slot (ends 11:00, which
      // is past 645). The last slot before the buffer is 09:30 (ends 10:30,
      // before 645), and the first slot after the buffer is 12:30 (starts
      // 12:30 / 750, after 735).
      const slots = computeAvailableSlots({
        ...baseInput,
        busy: [{ startMinutes: 660, endMinutes: 720 }],
        bufferMinutes: 15,
      });
      const starts = slots.map((s) => s.startTime);
      // Five slots are buffered out: 10:00, 10:30, 11:00, 11:30, 12:00.
      expect(slots).toHaveLength(10);
      // The last slot before the buffer is 09:30.
      expect(starts).toContain("09:30");
      // The first slot after the buffer is 12:30.
      expect(starts).toContain("12:30");
      // And every slot in the buffered window is gone.
      expect(starts).not.toContain("10:00");
      expect(starts).not.toContain("10:30");
      expect(starts).not.toContain("11:00");
      expect(starts).not.toContain("11:30");
      expect(starts).not.toContain("12:00");
    });
  });

  describe("past-slot filtering", () => {
    it("excludes slots that have already started when the query date is today", () => {
      // Today is the same date, current time 11:00 (660 min). All slots
      // starting at or before 11:00 are dropped; 11:30 onwards remain.
      const slots = computeAvailableSlots({
        ...baseInput,
        now: { date: "2024-06-15", minutesSinceMidnight: 660 },
      });
      const starts = slots.map((s) => s.startTime);
      // The 11:00 slot would start at exactly the current minute, so it is
      // considered "already started" and skipped (per `start <= nowMinutes`).
      expect(starts[0]).toBe("11:30");
      expect(starts).not.toContain("09:00");
      expect(starts).not.toContain("11:00");
    });

    it("does not filter past slots for a future date", () => {
      // `now.date` differs from `date` — no past-filtering.
      const slots = computeAvailableSlots({
        ...baseInput,
        now: { date: "2024-06-10", minutesSinceMidnight: 1439 },
      });
      // Should match the happy-path count: 15 slots.
      expect(slots).toHaveLength(15);
      expect(slots[0].startTime).toBe("09:00");
    });
  });
});
