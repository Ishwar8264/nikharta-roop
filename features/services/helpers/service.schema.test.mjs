import assert from "node:assert/strict";
import test from "node:test";

import {
  getServiceQuerySchema,
  listServiceCategoriesQuerySchema,
  listServicesQuerySchema,
} from "../../../schema/services/schema.service.ts";

test("listServiceCategoriesQuerySchema accepts optional branchId", () => {
  assert.deepEqual(listServiceCategoriesQuerySchema.parse({}), {});
  assert.deepEqual(
    listServiceCategoriesQuerySchema.parse({ branchId: "cmokbranch0001" }),
    { branchId: "cmokbranch0001" },
  );
});

test("listServicesQuerySchema requires branchId and coerces limit", () => {
  assert.deepEqual(
    listServicesQuerySchema.parse({
      branchId: "cmokbranch0001",
      limit: "10",
    }),
    {
      branchId: "cmokbranch0001",
      limit: 10,
    },
  );

  assert.equal(listServicesQuerySchema.safeParse({}).success, false);
});

test("listServicesQuerySchema rejects conflicting category filters", () => {
  assert.equal(
    listServicesQuerySchema.safeParse({
      branchId: "cmokbranch0001",
      categoryId: "cmokcategory0001",
      categorySlug: "hair-services",
    }).success,
    false,
  );
});

test("getServiceQuerySchema requires branchId", () => {
  assert.deepEqual(getServiceQuerySchema.parse({ branchId: "cmokbranch0001" }), {
    branchId: "cmokbranch0001",
  });

  assert.equal(getServiceQuerySchema.safeParse({}).success, false);
});
