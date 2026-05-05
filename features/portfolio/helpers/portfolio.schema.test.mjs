import assert from "node:assert/strict";
import test from "node:test";

import {
  adminListPortfolioQuerySchema,
  createPortfolioSchema,
  listPortfolioQuerySchema,
  updatePortfolioSchema,
} from "../../../schema/portfolio/schema.portfolio.ts";

test("listPortfolioQuerySchema coerces gallery filters", () => {
  assert.deepEqual(listPortfolioQuerySchema.parse({ featured: "true" }), {
    featured: true,
    limit: 20,
  });
});

test("adminListPortfolioQuerySchema supports published filters", () => {
  assert.deepEqual(adminListPortfolioQuerySchema.parse({ isPublished: "false" }), {
    isPublished: false,
    limit: 50,
  });
});

test("createPortfolioSchema accepts portfolio image payloads", () => {
  const parsed = createPortfolioSchema.parse({
    branchId: "cmokbranch0001",
    imageUrls: ["https://cdn.example.com/look.jpg"],
    titleHi: "ब्राइडल लुक",
  });

  assert.equal(parsed.branchId, "cmokbranch0001");
  assert.deepEqual(parsed.imageUrls, ["https://cdn.example.com/look.jpg"]);
});

test("updatePortfolioSchema rejects empty patches", () => {
  assert.equal(updatePortfolioSchema.safeParse({}).success, false);
});
