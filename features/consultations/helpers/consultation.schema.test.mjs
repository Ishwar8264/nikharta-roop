import assert from "node:assert/strict";
import test from "node:test";

import {
  adminListConsultationsQuerySchema,
  createConsultationSchema,
  listMyConsultationsQuerySchema,
  updateConsultationSchema,
} from "../../../schema/consultations/schema.consultation.ts";

test("createConsultationSchema parses request payloads", () => {
  assert.deepEqual(
    createConsultationSchema.parse({
      branchId: "cmokbranch0001",
      notes: "Need bridal consultation.",
      preferredDate: "2026-05-10",
      preferredTime: "11:30",
    }),
    {
      branchId: "cmokbranch0001",
      notes: "Need bridal consultation.",
      preferredDate: "2026-05-10",
      preferredTime: "11:30",
    },
  );
});

test("createConsultationSchema rejects invalid dates", () => {
  assert.equal(
    createConsultationSchema.safeParse({
      branchId: "cmokbranch0001",
      preferredDate: "2026-02-31",
    }).success,
    false,
  );
});

test("listMyConsultationsQuerySchema coerces limit", () => {
  assert.deepEqual(listMyConsultationsQuerySchema.parse({ limit: "10" }), {
    limit: 10,
  });
});

test("adminListConsultationsQuerySchema parses filters", () => {
  assert.deepEqual(
    adminListConsultationsQuerySchema.parse({
      branchId: "",
      date: "2026-05-10",
      status: "REQUESTED",
    }),
    {
      branchId: undefined,
      date: "2026-05-10",
      limit: 50,
      status: "REQUESTED",
    },
  );
});

test("updateConsultationSchema rejects empty patches", () => {
  assert.equal(updateConsultationSchema.safeParse({}).success, false);
});
