import type { CreateMediaInput, ListMediaQueryInput } from "@/schema/media/schema.media";

/**
 * Lists supported media owner id field names.
 */
export const mediaOwnerFields = [
  "blogPostId",
  "branchId",
  "packageId",
  "portfolioItemId",
  "productId",
  "reviewId",
  "serviceId",
  "staffId",
] as const;

/**
 * Extracts owner filters from media query or body input.
 */
export function mediaOwnerWhere(input: ListMediaQueryInput | Partial<CreateMediaInput>) {
  return Object.fromEntries(
    mediaOwnerFields.map((field) => [field, input[field]]),
  );
}

/**
 * Returns the first owner id field present on a media payload.
 */
export function getMediaOwner(input: Partial<CreateMediaInput>) {
  return mediaOwnerFields.find((field) => Boolean(input[field]));
}
