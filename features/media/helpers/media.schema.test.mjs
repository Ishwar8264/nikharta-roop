import assert from "node:assert/strict";
import test from "node:test";

import {
  createMediaSchema,
  listMediaQuerySchema,
  updateMediaSchema,
} from "../../../schema/media/schema.media.ts";

test("listMediaQuerySchema coerces limit", () => {
  assert.deepEqual(listMediaQuerySchema.parse({ limit: "25" }), {
    limit: 25,
  });
});

test("createMediaSchema accepts one owner id", () => {
  const parsed = createMediaSchema.parse({
    ownerType: "SERVICE",
    serviceId: "cmokservice0001",
    url: "https://cdn.example.com/service.jpg",
  });

  assert.equal(parsed.serviceId, "cmokservice0001");
});

test("createMediaSchema rejects missing owner ids", () => {
  assert.equal(createMediaSchema.safeParse({
    ownerType: "SERVICE",
    url: "https://cdn.example.com/service.jpg",
  }).success, false);
});

test("updateMediaSchema rejects empty patches", () => {
  assert.equal(updateMediaSchema.safeParse({}).success, false);
});
