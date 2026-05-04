import assert from "node:assert/strict";
import test from "node:test";

import {
  createStaffLeaveSchema,
  createStaffSchema,
  listStaffQuerySchema,
  updateStaffSchema,
} from "../../../schema/staff/schema.staff.ts";

test("listStaffQuerySchema parses optional service filter", () => {
  assert.deepEqual(
    listStaffQuerySchema.parse({
      branchId: "cmokbranch0001",
      serviceId: "",
    }),
    { branchId: "cmokbranch0001", serviceId: undefined },
  );
});

test("createStaffSchema parses admin staff payloads", () => {
  assert.deepEqual(
    createStaffSchema.parse({
      branchId: "cmokbranch0001",
      serviceIds: ["cmokservice0001"],
      userId: "cmokuser0001",
      workDays: [1, 2, 3],
      workEnd: "19:00",
      workStart: "10:00",
    }),
    {
      branchId: "cmokbranch0001",
      serviceIds: ["cmokservice0001"],
      userId: "cmokuser0001",
      workDays: [1, 2, 3],
      workEnd: "19:00",
      workStart: "10:00",
    },
  );
});

test("updateStaffSchema rejects empty patches", () => {
  assert.equal(updateStaffSchema.safeParse({}).success, false);
});

test("createStaffLeaveSchema rejects invalid leave windows", () => {
  assert.equal(
    createStaffLeaveSchema.safeParse({
      endsAt: "2026-05-10T10:00:00.000Z",
      startsAt: "2026-05-10T11:00:00.000Z",
    }).success,
    false,
  );
});
