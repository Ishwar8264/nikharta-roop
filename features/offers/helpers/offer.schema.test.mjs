import assert from "node:assert/strict";
import test from "node:test";

import {
  assignOfferServiceSchema,
  createOfferSchema,
  listOffersQuerySchema,
  updateOfferSchema,
  validateOfferSchema,
} from "../../../schema/offers/schema.offer.ts";

test("listOffersQuerySchema accepts optional branchId and coerces limit", () => {
  assert.deepEqual(listOffersQuerySchema.parse({ limit: "10" }), {
    limit: 10,
  });
});

test("validateOfferSchema normalizes coupon codes", () => {
  assert.deepEqual(
    validateOfferSchema.parse({
      branchId: "cmokbranch0001",
      code: " save10 ",
      orderAmount: "999",
    }),
    {
      branchId: "cmokbranch0001",
      code: "SAVE10",
      orderAmount: 999,
      serviceIds: [],
    },
  );
});

test("createOfferSchema parses admin offer payloads", () => {
  const parsed = createOfferSchema.parse({
    code: "BRIDAL10",
    discountType: "PERCENTAGE",
    discountValue: "10",
    titleHi: "ब्राइडल ऑफर",
    validFrom: "2026-05-01T00:00:00.000Z",
    validUntil: "2026-06-01T00:00:00.000Z",
  });

  assert.equal(parsed.code, "BRIDAL10");
  assert.equal(parsed.discountValue, 10);
  assert.deepEqual(parsed.serviceIds, []);
});

test("createOfferSchema rejects invalid date windows", () => {
  assert.equal(
    createOfferSchema.safeParse({
      code: "BAD",
      discountType: "FLAT_AMOUNT",
      discountValue: 100,
      titleHi: "गलत ऑफर",
      validFrom: "2026-06-01T00:00:00.000Z",
      validUntil: "2026-05-01T00:00:00.000Z",
    }).success,
    false,
  );
});

test("updateOfferSchema rejects empty patches", () => {
  assert.equal(updateOfferSchema.safeParse({}).success, false);
});

test("assignOfferServiceSchema requires service id", () => {
  assert.equal(
    assignOfferServiceSchema.safeParse({ serviceId: "cmokservice0001" }).success,
    true,
  );
});
