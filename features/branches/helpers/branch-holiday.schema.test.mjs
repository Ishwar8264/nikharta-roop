import assert from "node:assert/strict";
import test from "node:test";

import {
  createBranchHolidaySchema,
  listBranchHolidaysQuerySchema,
  toHolidayDate,
  updateBranchHolidaySchema,
} from "../../../schema/branches/schema.branch-holiday.ts";

test("listBranchHolidaysQuerySchema parses date filters and limit", () => {
  assert.deepEqual(
    listBranchHolidaysQuerySchema.parse({
      from: "2026-05-01",
      limit: "10",
      to: "2026-05-31",
    }),
    {
      from: "2026-05-01",
      limit: 10,
      to: "2026-05-31",
    },
  );
});

test("createBranchHolidaySchema defaults closed holidays", () => {
  assert.deepEqual(
    createBranchHolidaySchema.parse({
      date: "2026-05-10",
      reasonHi: "",
    }),
    {
      date: "2026-05-10",
      isClosed: true,
      reasonHi: null,
    },
  );
});

test("updateBranchHolidaySchema rejects empty patches", () => {
  assert.equal(updateBranchHolidaySchema.safeParse({}).success, false);
});

test("holiday schemas reject invalid dates", () => {
  assert.equal(
    createBranchHolidaySchema.safeParse({ date: "2026-02-31" }).success,
    false,
  );
});

test("toHolidayDate returns a date-only UTC value", () => {
  assert.equal(toHolidayDate("2026-05-10").toISOString(), "2026-05-10T00:00:00.000Z");
});
