export type MediaRow = {
  altHi: string | null;
  blogPostId: string | null;
  branchId: string | null;
  createdAt: Date;
  id: string;
  packageId: string | null;
  portfolioItemId: string | null;
  productId: string | null;
  provider: string | null;
  providerPublicId: string | null;
  reviewId: string | null;
  serviceId: string | null;
  sortOrder: number;
  staffId: string | null;
  url: string;
  ownerType: string;
};

/**
 * Converts a media row into the admin API shape.
 */
export function toPublicMedia(media: MediaRow) {
  return media;
}
