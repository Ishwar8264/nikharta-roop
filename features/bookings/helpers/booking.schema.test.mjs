import assert from "node:assert/strict";
import test from "node:test";

import { listBookingSlotsQuerySchema } from "../../../schema/bookings/schema.booking.ts";

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
