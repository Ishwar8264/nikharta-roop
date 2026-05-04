import assert from "node:assert/strict";
import test from "node:test";

import {
  createReviewSchema,
  listReviewsQuerySchema,
  updateReviewModerationSchema,
} from "../../../schema/reviews/schema.review.ts";

test("createReviewSchema parses review payloads", () => {
  assert.deepEqual(
    createReviewSchema.parse({
      commentHi: "बहुत अच्छी सेवा।",
      rating: "5",
    }),
    {
      commentHi: "बहुत अच्छी सेवा।",
      photoUrls: [],
      rating: 5,
    },
  );
});

test("createReviewSchema rejects ratings outside five stars", () => {
  assert.equal(createReviewSchema.safeParse({ rating: 6 }).success, false);
});

test("listReviewsQuerySchema coerces limit", () => {
  assert.deepEqual(listReviewsQuerySchema.parse({ limit: "10" }), {
    limit: 10,
  });
});

test("updateReviewModerationSchema requires approval flag", () => {
  assert.equal(
    updateReviewModerationSchema.safeParse({ isApproved: false }).success,
    true,
  );
});
