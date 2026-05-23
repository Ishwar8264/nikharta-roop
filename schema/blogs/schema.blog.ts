/**
 * Purpose: Blog request validation schemas.
 * Responsibility: Validate public/admin blog queries and write payloads.
 * Important Notes: Browser form blank optional fields are normalized for API-safe nullable values.
 */
import { BlogPostStatus } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by blog endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

const urlValueSchema = z.string().trim().url().max(1000);

const optionalNullableUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .nullable()
  .optional()
  .refine((value) => !value || urlValueSchema.safeParse(value).success, {
    message: "Enter a valid URL.",
  })
  .transform((value) => (value === "" ? null : value));

/**
 * Normalizes URL slugs used by public blog routes.
 */
const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(260)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * Query schema for GET /api/v1/blogs.
 */
export const listBlogsQuerySchema = z.object({
  categorySlug: z.string().trim().min(2).max(220).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Query schema for GET /api/v1/admin/blogs.
 */
export const adminListBlogsQuerySchema = listBlogsQuerySchema.extend({
  categoryId: optionalIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.nativeEnum(BlogPostStatus).optional(),
});

/**
 * Shared blog category request fields.
 */
const blogCategoryBodySchema = z.object({
  description: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  nameEn: z.string().trim().max(200).nullable().optional(),
  nameHi: z.string().trim().min(2).max(200),
  slug: slugSchema.max(220),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

/**
 * Shared blog post request fields.
 */
const blogPostBodySchema = z.object({
  categoryId: idSchema,
  contentHi: z.string().trim().min(10).max(100000),
  coverImageUrl: optionalNullableUrlSchema,
  excerptHi: z.string().trim().max(1000).nullable().optional(),
  publishedAt: z.coerce.date().nullable().optional(),
  slug: slugSchema,
  status: z.nativeEnum(BlogPostStatus).optional(),
  titleEn: z.string().trim().max(240).nullable().optional(),
  titleHi: z.string().trim().min(2).max(240),
});

export const createBlogCategorySchema = blogCategoryBodySchema;
export const updateBlogCategorySchema = blogCategoryBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one blog category field to update." },
);
export const createBlogPostSchema = blogPostBodySchema;
export const updateBlogPostSchema = blogPostBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one blog post field to update." },
);

export type AdminListBlogsQueryInput = Omit<
  z.infer<typeof adminListBlogsQuerySchema>,
  "limit"
> & {
  limit: number;
};
export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type ListBlogsQueryInput = Omit<
  z.infer<typeof listBlogsQuerySchema>,
  "limit"
> & {
  limit: number;
};
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
