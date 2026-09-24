import "server-only";

import type { PublicFavorite } from "./favorite.types";

interface RawRow {
  id: string;
  createdAt: Date;
  salonId: string | null;
  serviceId: string | null;
  productId: string | null;
  salon: { id: string; name: string; slug: string; images: string[] } | null;
  service: { id: string; name: string; slug: string; images: string[] } | null;
  product: { id: string; name: string; slug: string; images: string[] } | null;
}

/**
 * Converts a Prisma favorite row into the public shape.
 *
 * Why:
 * The DB row carries three nullable FKs; the client only needs one type
 * discriminator plus the resolved target summary.
 */
export function toPublicFavorite(row: RawRow): PublicFavorite {
  if (row.salonId && row.salon) {
    return {
      id: row.id,
      type: "salon",
      targetId: row.salonId,
      createdAt: row.createdAt,
      target: {
        id: row.salon.id,
        name: row.salon.name,
        slug: row.salon.slug,
        images: row.salon.images,
      },
    };
  }

  if (row.serviceId && row.service) {
    return {
      id: row.id,
      type: "service",
      targetId: row.serviceId,
      createdAt: row.createdAt,
      target: {
        id: row.service.id,
        name: row.service.name,
        slug: row.service.slug,
        images: row.service.images,
      },
    };
  }

  if (row.productId && row.product) {
    return {
      id: row.id,
      type: "product",
      targetId: row.productId,
      createdAt: row.createdAt,
      target: {
        id: row.product.id,
        name: row.product.name,
        slug: row.product.slug,
        images: row.product.images,
      },
    };
  }

  // Returning a fabricated target would hide a broken database invariant.
  throw new Error(`Favorite ${row.id} has no valid target`);
}
