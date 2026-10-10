import { z } from "zod";

import { createBlogPostSchema, createCategorySchema as blogCategorySchema } from "@/server/modules/blog/blog.schema";
import { createPackageSchema } from "@/server/modules/package/package.schema";
import { createProductSchema, createCategorySchema as productCategorySchema } from "@/server/modules/product/product.schema";
import { createSalonSchema, resourceIdSchema } from "@/server/modules/salon/salon.schema";
import { createCategorySchema as serviceCategorySchema } from "@/server/modules/service/service.schema";

export const slugResources = [
  "salon", "service", "product", "package", "service-category",
  "product-category", "blog-post", "blog-category", "blog-tag",
] as const;

export type SlugResource = typeof slugResources[number];

/** Reuse creation rules; service's reserved `create` slug is reported as unavailable. */
const slugSchemas = {
  salon: createSalonSchema.shape.slug.unwrap(),
  service: createSalonSchema.shape.slug.unwrap(),
  product: createProductSchema.shape.slug.unwrap(),
  package: createPackageSchema.shape.slug,
  "service-category": serviceCategorySchema.shape.slug.unwrap(),
  "product-category": productCategorySchema.shape.slug.unwrap(),
  "blog-post": createBlogPostSchema.shape.slug.unwrap(),
  "blog-category": blogCategorySchema.shape.slug.unwrap(),
  "blog-tag": createBlogPostSchema.shape.slug.unwrap(),
} satisfies Record<SlugResource, z.ZodType<string>>;

export function isSalonScoped(resource: SlugResource): boolean {
  return resource === "service" || resource === "product" || resource === "package";
}

/** Require a salon only for composite uniqueness; reject unsupported query parameters. */
export const slugAvailabilityQuerySchema = z.strictObject({
  resource: z.enum(slugResources),
  slug: z.string().trim(),
  salonId: resourceIdSchema.optional(),
}).superRefine((input, ctx) => {
  const result = slugSchemas[input.resource].safeParse(input.slug);
  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: issue.message });
    }
  }
  if (isSalonScoped(input.resource) && !input.salonId) {
    ctx.addIssue({ code: "custom", path: ["salonId"], message: "Salon ID is required for this resource" });
  }
  if (!isSalonScoped(input.resource) && input.salonId) {
    ctx.addIssue({ code: "custom", path: ["salonId"], message: "Salon ID is not supported for this resource" });
  }
});

export type SlugAvailabilityQuery = z.infer<typeof slugAvailabilityQuerySchema>;
