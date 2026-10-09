import "server-only";

import type { PublicProduct } from "./product.types";

/** Row shape returned by the repository's public select. */
interface ProductRowForMapper {
  id: string;
  salonId: string;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  name: string;
  slug: string;
  price: { toNumber(): number };
  stock: number;
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
 * Converts a Prisma product row into the public API shape.
 *
 * Why:
 * Prisma returns `Decimal` for `price`. Serializing `Decimal` directly to
 * JSON is not stable across Prisma versions, so we convert to a plain number
 * here and keep the response contract explicit.
 */
export function toPublicProduct(row: ProductRowForMapper): PublicProduct {
  return {
    id: row.id,
    salonId: row.salonId,
    categoryId: row.categoryId,
    category: row.category,
    name: row.name,
    slug: row.slug,
    price: row.price.toNumber(),
    stock: row.stock,
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
