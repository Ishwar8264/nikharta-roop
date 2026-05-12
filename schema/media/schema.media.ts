import { MediaOwnerType } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by media endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

const ownerIdFields = {
  blogPostId: optionalIdSchema,
  branchId: optionalIdSchema,
  packageId: optionalIdSchema,
  portfolioItemId: optionalIdSchema,
  productId: optionalIdSchema,
  reviewId: optionalIdSchema,
  serviceId: optionalIdSchema,
  staffId: optionalIdSchema,
};

export const listMediaQuerySchema = z.object({
  ...ownerIdFields,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  ownerType: z.nativeEnum(MediaOwnerType).optional(),
});

const mediaBodySchema = z.object({
  ...ownerIdFields,
  altHi: z.string().trim().max(500).nullable().optional(),
  ownerType: z.nativeEnum(MediaOwnerType),
  provider: z.string().trim().max(80).nullable().optional(),
  providerPublicId: z.string().trim().max(500).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  url: z.string().trim().url().max(2048),
});

export const createMediaSchema = mediaBodySchema.refine(hasOneOwnerId, {
  message: "Send exactly one owner id for the media asset.",
});

export const updateMediaSchema = mediaBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one media field to update." },
);

export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type ListMediaQueryInput = Omit<
  z.infer<typeof listMediaQuerySchema>,
  "limit"
> & {
  limit: number;
};
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

function hasOneOwnerId(value: Record<string, unknown>) {
  return Object.keys(ownerIdFields).filter((key) => Boolean(value[key])).length === 1;
}
