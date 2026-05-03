import assert from "node:assert/strict";
import test from "node:test";

import {
  createServiceAddOnSchema,
  createServiceCategorySchema,
  createServiceSchema,
  createServiceVariantSchema,
  getServiceQuerySchema,
  listServiceCategoriesQuerySchema,
  listServicesQuerySchema,
  updateServiceSchema,
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

test("createServiceCategorySchema parses admin category payloads", () => {
  assert.deepEqual(
    createServiceCategorySchema.parse({
      branchId: "",
      nameEn: "Hair Services",
      nameHi: "बाल सेवाएं",
      slug: "hair-services",
    }),
    {
      branchId: undefined,
      nameEn: "Hair Services",
      nameHi: "बाल सेवाएं",
      slug: "hair-services",
    },
  );
});

test("createServiceSchema parses admin service payloads", () => {
  assert.deepEqual(
    createServiceSchema.parse({
      branchId: "cmokbranch0001",
      categoryId: "cmokcategory0001",
      descriptionHi: "स्टाइलिश हेयर कट सेवा।",
      durationMinutes: "45",
      nameEn: "Hair Cut",
      nameHi: "हेयर कट",
      price: "499",
      slug: "hair-cut",
    }),
    {
      branchId: "cmokbranch0001",
      categoryId: "cmokcategory0001",
      descriptionHi: "स्टाइलिश हेयर कट सेवा।",
      durationMinutes: 45,
      nameEn: "Hair Cut",
      nameHi: "हेयर कट",
      price: 499,
      slug: "hair-cut",
    },
  );
});

test("updateServiceSchema rejects empty patches", () => {
  assert.equal(updateServiceSchema.safeParse({}).success, false);
});

test("createServiceVariantSchema parses variant payloads", () => {
  assert.deepEqual(
    createServiceVariantSchema.parse({
      durationMinutes: 60,
      nameHi: "प्रीमियम",
      price: 799,
    }),
    {
      durationMinutes: 60,
      nameHi: "प्रीमियम",
      price: 799,
    },
  );
});

test("createServiceAddOnSchema parses add-on payloads", () => {
  assert.deepEqual(
    createServiceAddOnSchema.parse({
      durationMinutes: "15",
      nameHi: "हेयर वॉश",
      price: "149",
    }),
    {
      durationMinutes: 15,
      nameHi: "हेयर वॉश",
      price: 149,
    },
  );
});
