import assert from "node:assert/strict";
import test from "node:test";

import {
  adminListBlogsQuerySchema,
  createBlogCategorySchema,
  createBlogPostSchema,
  updateBlogPostSchema,
} from "../../../schema/blogs/schema.blog.ts";

test("adminListBlogsQuerySchema coerces filters and limit", () => {
  assert.deepEqual(adminListBlogsQuerySchema.parse({ limit: "25" }), {
    limit: 25,
  });
});

test("createBlogCategorySchema accepts category payloads", () => {
  const parsed = createBlogCategorySchema.parse({
    nameHi: "ब्यूटी टिप्स",
    slug: "beauty-tips",
  });

  assert.equal(parsed.slug, "beauty-tips");
});

test("createBlogPostSchema accepts published blog payloads", () => {
  const parsed = createBlogPostSchema.parse({
    categoryId: "cmokcategory0001",
    contentHi: "यह ब्लॉग कंटेंट टेस्ट के लिए पर्याप्त लंबा है।",
    slug: "bridal-makeup-guide",
    status: "PUBLISHED",
    titleHi: "ब्राइडल मेकअप गाइड",
  });

  assert.equal(parsed.status, "PUBLISHED");
});

test("updateBlogPostSchema rejects empty patches", () => {
  assert.equal(updateBlogPostSchema.safeParse({}).success, false);
});
