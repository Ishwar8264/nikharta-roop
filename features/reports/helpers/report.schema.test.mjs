import assert from "node:assert/strict";
import test from "node:test";

import { reportQuerySchema } from "../../../schema/reports/schema.report.ts";

test("reportQuerySchema accepts empty report filters", () => {
  assert.deepEqual(reportQuerySchema.parse({}), {});
});

test("reportQuerySchema parses date range filters", () => {
  assert.deepEqual(reportQuerySchema.parse({
    from: "2026-05-01",
    to: "2026-05-06",
  }), {
    from: "2026-05-01",
    to: "2026-05-06",
  });
});

test("reportQuerySchema rejects invalid dates", () => {
  assert.equal(reportQuerySchema.safeParse({ from: "bad-date" }).success, false);
});
