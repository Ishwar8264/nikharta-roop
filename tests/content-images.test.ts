import { describe, expect, it } from "vitest";

import { createProductSchema, updateProductSchema } from "../src/server/modules/product/product.schema";
import { createServiceSchema, updateServiceSchema } from "../src/server/modules/service/service.schema";
import { createBlogPostSchema, updateBlogPostSchema } from "../src/server/modules/blog/blog.schema";
import { createServiceFormSchema } from "../src/features/service/schema";
import { toPublicProduct } from "../src/server/modules/product/product.mapper";
import { toPublicService } from "../src/server/modules/service/service.mapper";

const imageFields = { coverImage: "https://example.com/cover.jpg", bannerImage: "https://example.com/banner.jpg" };

for (const [name, create, update, input] of [
  ["product", createProductSchema, updateProductSchema, { name: "Shampoo", price: 200 }],
  ["service", createServiceSchema, updateServiceSchema, { name: "Haircut", price: 300, duration: 30 }],
  ["blog", createBlogPostSchema, updateBlogPostSchema, { title: "Hair care tips", content: "Article content" }],
] as const) {
  describe(`${name} dedicated images`, () => {
    it("accepts existing payloads and dedicated image URLs", () => {
      expect(create.safeParse(input).success).toBe(true);
      expect(create.parse({ ...input, ...imageFields })).toMatchObject(imageFields);
    });
    it("preserves omitted fields and supports explicit clearing", () => {
      const patch = update.parse({ bannerImage: null });
      expect(patch).toEqual({ bannerImage: null });
      expect(update.parse({ coverImage: null })).toEqual({ coverImage: null });
    });
    it("rejects invalid and oversized URLs on both create and update", () => {
      for (const field of ["coverImage", "bannerImage"]) {
        for (const value of ["invalid", `https://example.com/${"a".repeat(2048)}`]) {
          expect(create.safeParse({ ...input, [field]: value }).success).toBe(false);
          expect(update.safeParse({ [field]: value }).success).toBe(false);
        }
      }
    });
  });
}

it("validates service image fields in the client form too", () => {
  const input = { name: "Haircut", price: 300, duration: 30, isActive: true, images: [] };
  expect(createServiceFormSchema.parse({ ...input, ...imageFields })).toMatchObject(imageFields);
  expect(createServiceFormSchema.safeParse({ ...input, bannerImage: "invalid" }).success).toBe(false);
});

it("includes independent image fields in product and service responses", () => {
  const row = {
    id: "test", salonId: "salon", categoryId: null, category: null,
    name: "Test", slug: "test", price: { toNumber: () => 300 }, stock: 2,
    duration: 30, isActive: true, shortDescription: null, description: null,
    descriptionHtml: null, descriptionJson: null, ...imageFields,
    images: ["https://example.com/gallery.jpg"], createdAt: new Date(), updatedAt: new Date(),
  };
  for (const map of [toPublicProduct, toPublicService]) {
    expect(map(row)).toMatchObject({ ...imageFields, images: row.images, price: 300 });
  }
});
