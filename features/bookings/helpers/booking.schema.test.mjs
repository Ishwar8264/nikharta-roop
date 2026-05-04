import assert from "node:assert/strict";
import test from "node:test";

import {
  adminAssignStaffSchema,
  adminListBookingsQuerySchema,
  cancelBookingSchema,
  createBookingSchema,
  listBookingsQuerySchema,
  listBookingSlotsQuerySchema,
  rescheduleBookingSchema,
} from "../../../schema/bookings/schema.booking.ts";

test("listBookingSlotsQuerySchema parses required slot query fields", () => {
  assert.deepEqual(
    listBookingSlotsQuerySchema.parse({
      branchId: "cmokbranch0001",
      date: "2026-05-10",
      serviceId: "cmokservice0001",
      serviceVariantId: "",
      staffId: "",
    }),
    {
      branchId: "cmokbranch0001",
      date: "2026-05-10",
      serviceId: "cmokservice0001",
      serviceVariantId: undefined,
      staffId: undefined,
    },
  );
});

test("listBookingSlotsQuerySchema rejects invalid dates", () => {
  assert.equal(
    listBookingSlotsQuerySchema.safeParse({
      branchId: "cmokbranch0001",
      date: "2026/05/10",
      serviceId: "cmokservice0001",
    }).success,
    false,
  );

  assert.equal(
    listBookingSlotsQuerySchema.safeParse({
      branchId: "cmokbranch0001",
      date: "2026-02-31",
      serviceId: "cmokservice0001",
    }).success,
    false,
  );
});

test("listBookingsQuerySchema parses optional filters", () => {
  assert.deepEqual(
    listBookingsQuerySchema.parse({
      limit: "10",
      status: "PENDING",
    }),
    {
      limit: 10,
      status: "PENDING",
    },
  );
});

test("createBookingSchema parses booking payloads", () => {
  assert.deepEqual(
    createBookingSchema.parse({
      addOns: [{ addOnId: "cmokaddon0001", quantity: 2 }],
      bookingDate: "2026-05-10",
      branchId: "cmokbranch0001",
      notes: "Customer prefers afternoon reminder.",
      serviceId: "cmokservice0001",
      serviceVariantId: "",
      slotStart: "10:00:00",
      staffId: "",
    }),
    {
      addOns: [{ addOnId: "cmokaddon0001", quantity: 2 }],
      bookingDate: "2026-05-10",
      branchId: "cmokbranch0001",
      notes: "Customer prefers afternoon reminder.",
      serviceId: "cmokservice0001",
      serviceVariantId: undefined,
      slotStart: "10:00:00",
      staffId: undefined,
    },
  );
});

test("rescheduleBookingSchema rejects off-grid slot times", () => {
  assert.equal(
    rescheduleBookingSchema.safeParse({
      bookingDate: "2026-05-10",
      slotStart: "10:15:00",
    }).success,
    false,
  );
});

test("cancelBookingSchema accepts an empty body", () => {
  assert.deepEqual(cancelBookingSchema.parse(null), {});
});

test("adminListBookingsQuerySchema parses admin filters", () => {
  assert.deepEqual(
    adminListBookingsQuerySchema.parse({
      branchId: "",
      date: "2026-05-10",
      limit: "25",
      status: "CONFIRMED",
    }),
    {
      branchId: undefined,
      date: "2026-05-10",
      limit: 25,
      status: "CONFIRMED",
    },
  );
});

test("adminAssignStaffSchema requires staff id", () => {
  assert.equal(
    adminAssignStaffSchema.safeParse({
      staffId: "cmokstaff0001",
    }).success,
    true,
  );
});
