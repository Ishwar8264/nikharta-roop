import assert from "node:assert/strict";
import test from "node:test";

import { toPublicBranch } from "./branch.mapper.ts";

test("toPublicBranch exposes public branch fields with time strings", () => {
  const updatedAt = new Date("2026-05-01T10:00:00.000Z");

  const branch = toPublicBranch({
    address: "Main Road, Jaipur",
    city: "Jaipur",
    closeTime: new Date("1970-01-01T19:30:00.000Z"),
    createdAt: updatedAt,
    googleMapsUrl: "https://maps.example.com/branch",
    id: "branch_1",
    isActive: true,
    latitude: { toString: () => "26.9124000" },
    longitude: { toString: () => "75.7873000" },
    nameEn: "Nikharta Roop Jaipur",
    nameHi: "निखरता रूप जयपुर",
    openTime: new Date("1970-01-01T10:00:00.000Z"),
    phone: "9876543210",
    placeId: "ChIJ123",
    updatedAt,
  });

  assert.deepEqual(branch, {
    address: "Main Road, Jaipur",
    city: "Jaipur",
    closeTime: "19:30:00",
    createdAt: updatedAt,
    googleMapsUrl: "https://maps.example.com/branch",
    id: "branch_1",
    isActive: true,
    latitude: "26.9124000",
    longitude: "75.7873000",
    nameEn: "Nikharta Roop Jaipur",
    nameHi: "निखरता रूप जयपुर",
    openTime: "10:00:00",
    phone: "9876543210",
    placeId: "ChIJ123",
    updatedAt,
  });
});
