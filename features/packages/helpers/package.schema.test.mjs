import assert from "node:assert/strict";
import test from "node:test";

import {
  assignPackageServiceSchema,
  createPackageSchema,
  getPackageQuerySchema,
  listPackagesQuerySchema,
  updatePackageSchema,
} from "../../../schema/packages/schema.package.ts";

test("listPackagesQuerySchema requires branchId and coerces limit", () => {
  assert.deepEqual(
    listPackagesQuerySchema.parse({
      branchId: "cmokbranch0001",
      limit: "10",
    }),
    {
      branchId: "cmokbranch0001",
      limit: 10,
    },
  );
  assert.equal(listPackagesQuerySchema.safeParse({}).success, false);
});

test("listPackagesQuerySchema rejects conflicting category filters", () => {
  assert.equal(
    listPackagesQuerySchema.safeParse({
      branchId: "cmokbranch0001",
      categoryId: "cmokcategory0001",
      categorySlug: "bridal",
    }).success,
    false,
  );
});

test("getPackageQuerySchema requires branchId", () => {
  assert.deepEqual(getPackageQuerySchema.parse({ branchId: "cmokbranch0001" }), {
    branchId: "cmokbranch0001",
  });
});

test("createPackageSchema parses admin package payloads", () => {
  assert.deepEqual(
    createPackageSchema.parse({
      branchId: "cmokbranch0001",
      nameHi: "ब्राइडल पैकेज",
      price: "4999",
      slug: "bridal-package",
    }),
    {
      branchId: "cmokbranch0001",
      nameHi: "ब्राइडल पैकेज",
      price: 4999,
      services: [],
      slug: "bridal-package",
    },
  );
});

test("updatePackageSchema rejects empty patches", () => {
  assert.equal(updatePackageSchema.safeParse({}).success, false);
});

test("assignPackageServiceSchema defaults quantity and sort order", () => {
  assert.deepEqual(
    assignPackageServiceSchema.parse({ serviceId: "cmokservice0001" }),
    {
      quantity: 1,
      serviceId: "cmokservice0001",
      sortOrder: 0,
    },
  );
});
