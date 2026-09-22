import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

const slugSchema = z
  .string({ error: "Slug must be a string" })
  .trim()
  .min(2, "Slug must contain at least 2 characters")
  .max(80, "Slug must contain at most 80 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  );

const optionalUrlSchema = z
  .string({ error: "URL must be a string" })
  .trim()
  .url("URL is invalid")
  .max(2048, "URL is too long");

/**
 * Public list query — paginated with filters and sortable.
 *
 * Why:
 * Cursor pagination keeps infinite scroll stable under inserts. Sort keys are
 * explicitly allow-listed so arbitrary database fields cannot be requested.
 * `inStock` is parsed from a string enum rather than `z.coerce.boolean` because
 * coercion treats the string "false" as truthy.
 */
export const listProductsQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(20),
  category: slugSchema.optional(),
  search: z
    .string({ error: "Search must be a string" })
    .trim()
    .min(2, "Search must contain at least 2 characters")
    .max(80, "Search must contain at most 80 characters")
    .optional(),
  minPrice: z.coerce
    .number({ error: "Minimum price must be a number" })
    .min(0, "Minimum price cannot be negative")
    .max(10_000_000, "Minimum price is too large")
    .optional(),
  maxPrice: z.coerce
    .number({ error: "Maximum price must be a number" })
    .min(0, "Maximum price cannot be negative")
    .max(10_000_000, "Maximum price is too large")
    .optional(),
  inStock: z
    .enum(["true", "false"], {
      error: "inStock must be 'true' or 'false'",
    })
    .transform((value) => value === "true")
    .optional(),
  sortBy: z
    .enum(["createdAt", "price", "name"], {
      error: "Sort field is invalid",
    })
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], { error: "Sort order must be 'asc' or 'desc'" })
    .default("desc"),
}).refine(
  (input) =>
    input.minPrice === undefined ||
    input.maxPrice === undefined ||
    input.minPrice <= input.maxPrice,
  {
    path: ["maxPrice"],
    message: "Maximum price must be greater than or equal to minimum price",
  },
);

/**
 * Product creation body.
 *
 * Why:
 * `price` and `stock` are accepted as JSON numbers. `stock` defaults to 0 so
 * a "coming soon" product can be created before inventory arrives. Bounds
 * keep both values well inside their column ranges.
 */
export const createProductSchema = z.strictObject({
  name: z
    .string({ error: "Name must be a string" })
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(120, "Name must contain at most 120 characters"),
  slug: slugSchema.optional(),
  categoryId: resourceIdSchema.optional(),
  price: z
    .number({ error: "Price must be a number" })
    .min(0, "Price cannot be negative")
    .max(10_000_000, "Price is too large")
    .multipleOf(0.01, "Price must have at most 2 decimal places"),
  stock: z
    .number({ error: "Stock must be a number" })
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .max(1_000_000, "Stock is too large")
    .default(0),
  isActive: z.boolean({ error: "Active flag must be a boolean" }).default(true),
  shortDescription: z
    .string({ error: "Short description must be a string" })
    .trim()
    .max(280, "Short description must contain at most 280 characters")
    .optional(),
  description: z
    .string({ error: "Description must be a string" })
    .trim()
    .max(5000, "Description must contain at most 5000 characters")
    .optional(),
  descriptionHtml: z
    .string({ error: "HTML description must be a string" })
    .max(20000, "HTML description is too long")
    .optional(),
  descriptionJson: z
    .string({ error: "JSON description must be a string" })
    .max(50000, "JSON description is too long")
    .optional(),
  seoTitle: z
    .string({ error: "SEO title must be a string" })
    .trim()
    .max(70, "SEO title must contain at most 70 characters")
    .optional(),
  seoDescription: z
    .string({ error: "SEO description must be a string" })
    .trim()
    .max(160, "SEO description must contain at most 160 characters")
    .optional(),
  images: z
    .array(optionalUrlSchema, { error: "Images must be an array of URLs" })
    .max(10, "At most 10 images are allowed")
    .default([]),
});

/**
 * Partial update body — mirrors service's PATCH semantics.
 *
 * Why:
 * Defaults belong to creation only. PATCH must preserve omitted fields, so
 * each defaultable field has its default removed. Nullable text fields allow
 * explicit null to clear them.
 */
export const updateProductSchema = createProductSchema
  .partial()
  .extend({
    categoryId: createProductSchema.shape.categoryId.nullable(),
    stock: createProductSchema.shape.stock.removeDefault().optional(),
    isActive: createProductSchema.shape.isActive.removeDefault().optional(),
    images: createProductSchema.shape.images.removeDefault().optional(),
    shortDescription: createProductSchema.shape.shortDescription.nullable(),
    description: createProductSchema.shape.description.nullable(),
    descriptionHtml: createProductSchema.shape.descriptionHtml.nullable(),
    descriptionJson: createProductSchema.shape.descriptionJson.nullable(),
    seoTitle: createProductSchema.shape.seoTitle.nullable(),
    seoDescription: createProductSchema.shape.seoDescription.nullable(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    { message: "At least one field must be provided" },
  );

/**
 * Body for creating a global product category. SUPER_ADMIN only.
 *
 * Note:
 * ProductCategory has no `icon` column in the schema, so this schema does not
 * accept one — unlike the service category counterpart.
 */
export const createCategorySchema = z.strictObject({
  name: z
    .string({ error: "Name must be a string" })
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(80, "Name must contain at most 80 characters"),
  slug: slugSchema.optional(),
});

/** Public list query for product categories. */
export const listCategoriesQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(50),
});

/** URL params for the nested product routes. */
export const productParamSchema = z.strictObject({
  salonRef: z
    .string({ error: "Salon reference must be a string" })
    .trim()
    .min(2, "Salon reference must contain at least 2 characters")
    .max(80, "Salon reference must contain at most 80 characters"),
  productRef: z
    .string({ error: "Product reference must be a string" })
    .trim()
    .min(2, "Product reference must contain at least 2 characters")
    .max(80, "Product reference must contain at most 80 characters"),
});
