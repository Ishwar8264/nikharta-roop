import assert from "node:assert/strict";
import test from "node:test";

import {
  adjustInventorySchema,
  createInventorySchema,
  listInventoryQuerySchema,
  updateInventorySchema,
} from "../../../schema/inventory/schema.inventory.ts";

test("listInventoryQuerySchema coerces filters and limit", () => {
  assert.deepEqual(listInventoryQuerySchema.parse({ limit: "25" }), {
    limit: 25,
  });
});

test("createInventorySchema accepts inventory item payloads", () => {
  const parsed = createInventorySchema.parse({
    branchId: "cmokbranch0001",
    nameHi: "क्रीम",
    quantityOnHand: "12.5",
  });

  assert.equal(parsed.quantityOnHand, 12.5);
});

test("adjustInventorySchema rejects zero quantity changes", () => {
  assert.equal(adjustInventorySchema.safeParse({ quantityChange: 0 }).success, false);
});

test("updateInventorySchema rejects empty patches", () => {
  assert.equal(updateInventorySchema.safeParse({}).success, false);
});
