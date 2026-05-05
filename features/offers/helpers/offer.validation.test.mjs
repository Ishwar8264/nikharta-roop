import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateDiscount,
  getOfferInvalidReason,
} from "../handlers/offer-validation.helpers.ts";

const baseOffer = {
  discountType: "PERCENTAGE",
  discountValue: { toString: () => "10" },
  id: "offer1",
  maxDiscount: null,
  minOrder: null,
  perUserLimit: null,
  services: [],
  usageCount: 0,
  usageLimit: null,
};

test("calculateDiscount handles percentage caps", () => {
  assert.equal(
    calculateDiscount(
      { ...baseOffer, maxDiscount: { toString: () => "50" } },
      999,
    ),
    50,
  );
});

test("getOfferInvalidReason blocks restricted services", () => {
  assert.equal(
    getOfferInvalidReason(
      { ...baseOffer, services: [{ serviceId: "service-a" }] },
      {
        branchId: "cmokbranch0001",
        code: "SAVE10",
        orderAmount: 999,
        serviceIds: ["service-b"],
      },
      0,
    ),
    "Offer is not valid for selected services.",
  );
});
