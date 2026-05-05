import assert from "node:assert/strict";
import test from "node:test";

import {
  createProductSaleSchema,
  listProductSalesQuerySchema,
  updateProductSaleSchema,
} from "../../../schema/product-sales/schema.product-sale.ts";

test("listProductSalesQuerySchema coerces filters and limit", () => {
  assert.deepEqual(listProductSalesQuerySchema.parse({ limit: "25" }), {
    limit: 25,
  });
});

test("createProductSaleSchema accepts sale item payloads", () => {
  const parsed = createProductSaleSchema.parse({
    branchId: "cmokbranch0001",
    items: [{ productId: "cmokproduct0001", quantity: "2" }],
  });

  assert.equal(parsed.items[0].quantity, 2);
  assert.equal(parsed.discountAmount, 0);
});

test("updateProductSaleSchema accepts terminal status changes", () => {
  assert.equal(
    updateProductSaleSchema.safeParse({ status: "COMPLETED" }).success,
    true,
  );
});

test("updateProductSaleSchema rejects empty patches", () => {
  assert.equal(updateProductSaleSchema.safeParse({}).success, false);
});
