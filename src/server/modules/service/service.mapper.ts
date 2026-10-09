import "server-only";

import type { PublicService } from "./service.types";

/** Row shape returned by the repository's public select. */
interface ServiceRowForMapper {
  id: string;
  salonId: string;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  } | null;
  name: string;
  slug: string;
  price: { toNumber(): number };
  duration: number;
  isActive: boolean;
  shortDescription: string | null;
  description: string | null;
  descriptionHtml: string | null;
  descriptionJson: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Converts a Prisma service row into the public API shape.
 *
 * Why:
 * Prisma returns `Decimal` for `price`. Serializing `Decimal` directly to
 * JSON is not stable across Prisma versions, so we convert to a plain number
 * here and keep the response contract explicit.
 */
export function toPublicService(row: ServiceRowForMapper): PublicService {
  return {
    id: row.id,
    salonId: row.salonId,
    categoryId: row.categoryId,
    category: row.category,
    name: row.name,
    slug: row.slug,
    price: row.price.toNumber(),
    duration: row.duration,
    isActive: row.isActive,
    shortDescription: row.shortDescription,
    description: row.description,
    descriptionHtml: row.descriptionHtml,
    descriptionJson: row.descriptionJson,
    coverImage: row.coverImage,
    bannerImage: row.bannerImage,
    images: row.images,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
