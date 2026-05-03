import assert from "node:assert/strict";
import test from "node:test";

import { toPublicBookingSlot } from "./booking.mapper.ts";

test("toPublicBookingSlot formats slot minutes and availability", () => {
  assert.deepEqual(
    toPublicBookingSlot({
      availableStaffCount: 2,
      endMinutes: 645,
      startMinutes: 600,
    }),
    {
      available: true,
      availableStaffCount: 2,
      endTime: "10:45:00",
      startTime: "10:00:00",
    },
  );
});

test("toPublicBookingSlot marks empty capacity as unavailable", () => {
  assert.deepEqual(
    toPublicBookingSlot({
      availableStaffCount: 0,
      endMinutes: 1110,
      startMinutes: 1080,
    }),
    {
      available: false,
      availableStaffCount: 0,
      endTime: "18:30:00",
      startTime: "18:00:00",
    },
  );
});
