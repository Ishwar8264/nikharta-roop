import assert from "node:assert/strict";
import test from "node:test";

import {
  createBranchSchema,
  updateBranchSchema,
} from "../../../schema/branches/schema.branch.ts";

test("createBranchSchema parses branch creation payloads", () => {
  const branch = createBranchSchema.parse({
    address: "Main Road, Jaipur",
    city: "Jaipur",
    closeTime: "19:30",
    googleMapsUrl: "",
    latitude: 26.9124,
    longitude: 75.7873,
    nameEn: "",
    nameHi: "निखरता रूप जयपुर",
    openTime: "10:00:00",
    phone: "9876543210",
    placeId: "ChIJ123",
  });

  assert.equal(branch.googleMapsUrl, null);
  assert.equal(branch.latitude, 26.9124);
  assert.equal(branch.longitude, 75.7873);
  assert.equal(branch.nameEn, null);
  assert.equal(branch.placeId, "ChIJ123");
  assert.equal(branch.openTime.toISOString().slice(11, 19), "10:00:00");
  assert.equal(branch.closeTime.toISOString().slice(11, 19), "19:30:00");
});

test("updateBranchSchema accepts single-field branch patches", () => {
  assert.deepEqual(updateBranchSchema.parse({ city: "Udaipur" }), {
    city: "Udaipur",
  });

  assert.deepEqual(updateBranchSchema.parse({ isActive: false }), {
    isActive: false,
  });

  assert.deepEqual(
    updateBranchSchema.parse({
      latitude: null,
      longitude: null,
    }),
    {
      latitude: null,
      longitude: null,
    },
  );
});

test("updateBranchSchema rejects empty branch patches", () => {
  const parsed = updateBranchSchema.safeParse({});

  assert.equal(parsed.success, false);
});

test("branch schemas reject invalid time and coordinate pairs", () => {
  assert.equal(
    createBranchSchema.safeParse({
      address: "Main Road, Jaipur",
      city: "Jaipur",
      closeTime: "10:00",
      latitude: 26.9124,
      nameHi: "निखरता रूप जयपुर",
      openTime: "19:30",
      phone: "9876543210",
    }).success,
    false,
  );

  assert.equal(updateBranchSchema.safeParse({ latitude: 26.9124 }).success, false);
});
