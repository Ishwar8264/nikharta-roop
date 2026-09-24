import type { z } from "zod";

import type {
  addFavoriteSchema,
  listFavoritesQuerySchema,
} from "./favorite.schema";

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
export type ListFavoritesQuery = z.infer<typeof listFavoritesQuerySchema>;
export type FavoriteTargetType = "salon" | "service" | "product";

/**
 * Public favorite shape.
 *
 * Why:
 * A favorite is a pointer, not a full payload. Returning the target's
 * summary lets the UI render a list without a second round-trip.
 */
export interface PublicFavorite {
  id: string;
  type: FavoriteTargetType;
  targetId: string;
  createdAt: Date;
  target: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
}

export interface PaginatedFavorites {
  items: PublicFavorite[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Response for the check endpoint. */
export interface FavoriteCheckResult {
  isFavorited: boolean;
  favoriteId: string | null;
}
