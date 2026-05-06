import assert from "node:assert/strict";
import test from "node:test";

import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "../../../schema/expenses/schema.expense.ts";

test("listExpensesQuerySchema coerces filters and limit", () => {
  assert.deepEqual(listExpensesQuerySchema.parse({ limit: "25" }), {
    limit: 25,
  });
});

test("createExpenseSchema accepts expense payloads", () => {
  const parsed = createExpenseSchema.parse({
    amount: "1200.50",
    branchId: "cmokbranch0001",
    category: "UTILITIES",
    expenseDate: "2026-05-06",
    titleHi: "बिजली बिल",
  });

  assert.equal(parsed.amount, 1200.5);
});

test("updateExpenseSchema rejects empty patches", () => {
  assert.equal(updateExpenseSchema.safeParse({}).success, false);
});
