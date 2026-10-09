/**
 * Browser-safe mirror of `src/server/modules/favorite/favorite.types.ts`.
 *
 * Why a copy and not an import:
 * Server modules may be marked `server-only`. Mirroring the public shape here
 * keeps Client Components free of `src/server/**` imports while still giving
 * the favorite button a single typed contract with the API.
 */
export type FavoriteTargetType = "salon" | "service" | "product";

/**
 * Public favorite shape (dates serialise to ISO strings over JSON).
 *
 * Why `target` is denormalised into the row:
 * A favorite is a pointer, not a full payload. Returning the target's
 * summary lets the dashboard list render without a second round-trip per
 * row.
 */
export interface PublicFavorite {
  id: string;
  type: FavoriteTargetType;
  targetId: string;
  createdAt: string;
  target: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
}

/** Paginated response from `GET /favorites`. */
export interface PaginatedFavorites {
  items: PublicFavorite[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Response from `GET /favorites/check`. */
export interface FavoriteCheckResult {
  isFavorited: boolean;
  favoriteId: string | null;
}

/** Body for `POST /favorites`. */
export interface AddFavoriteBody {
  type: FavoriteTargetType;
  targetId: string;
}

/** API response envelopes. */
export interface FavoriteListResponse {
  message: string;
  data: PublicFavorite[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

export interface FavoriteMutationResponse {
  message: string;
  data: { favorite: PublicFavorite };
}

export interface FavoriteCheckResponse {
  message: string;
  data: FavoriteCheckResult;
}
