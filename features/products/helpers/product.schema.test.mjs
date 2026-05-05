import assert from "node:assert/strict";
import test from "node:test";

import {
  createProductCategorySchema,
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from "../../../schema/products/schema.product.ts";

test("listProductsQuerySchema coerces filters and limit", () => {
  assert.deepEqual(listProductsQuerySchema.parse({ limit: "25" }), {
    limit: 25,
  });
});

test("createProductCategorySchema accepts global category payloads", () => {
  const parsed = createProductCategorySchema.parse({
    nameHi: "हेयर केयर",
    slug: "hair-care",
  });

  assert.equal(parsed.slug, "hair-care");
});

test("createProductSchema accepts product payloads", () => {
  const parsed = createProductSchema.parse({
    branchId: "cmokbranch0001",
    nameHi: "शैम्पू",
    price: "299.00",
    slug: "shampoo",
  });

  assert.equal(parsed.price, 299);
});

test("updateProductSchema rejects empty patches", () => {
  assert.equal(updateProductSchema.safeParse({}).success, false);
});
