import { api } from "@/lib/api/backend.client";

import type {
  AddFavoriteBody,
  FavoriteCheckResponse,
  FavoriteCheckResult,
  FavoriteListResponse,
  FavoriteMutationResponse,
  FavoriteTargetType,
  PaginatedFavorites,
  PublicFavorite,
} from "./types";

export type {
  AddFavoriteBody,
  FavoriteCheckResult,
  FavoriteListResponse,
  FavoriteMutationResponse,
  FavoriteCheckResponse,
  FavoriteTargetType,
  PaginatedFavorites,
  PublicFavorite,
};

/**
 * Lists the caller's favorites. Authenticated.
 *
 * Why an explicit limit param:
 * The server caps the limit at 50; the favorites dashboard uses 50 to fetch
 * the whole list in one go (the favorite surface is small enough that
 * cursor pagination would add UX cost without saving wire bytes).
 */
export function listFavoritesApi(
  query: { limit?: number; type?: FavoriteTargetType; cursor?: string } = {},
) {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.type) params.set("type", query.type);
  if (query.cursor) params.set("cursor", query.cursor);
  const search = params.toString();
  return api.get<FavoriteListResponse>(`/favorites${search ? `?${search}` : ""}`);
}

/** Adds a favorite. Authenticated. Idempotent-safe (server returns 409). */
export function addFavoriteApi(input: AddFavoriteBody) {
  return api.post<FavoriteMutationResponse>("/favorites", input);
}

/** Removes a favorite by its id. Authenticated. */
export function removeFavoriteApi(favoriteId: string) {
  return api.delete<{ message: string; data: null }>(
    `/favorites/${encodeURIComponent(favoriteId)}`,
  );
}

/**
 * Checks whether a target is already favorited by the caller.
 *
 * Why a separate endpoint instead of GET /favorites + client filter:
 * A user with hundreds of favorites would paginate a long list just to
 * colour one heart. The check endpoint returns a single boolean in one
 * round-trip, and the server page can call the underlying service directly
 * (no HTTP hop) to pre-seed the heart on first paint.
 */
export function checkFavoriteApi(
  type: FavoriteTargetType,
  targetId: string,
) {
  const params = new URLSearchParams({ type, targetId });
  return api.get<FavoriteCheckResponse>(`/favorites/check?${params.toString()}`);
}

/** Convenience: convert a raw `FavoriteListResponse` into the public shape. */
export function toPaginatedFavorites(
  response: FavoriteListResponse,
): PaginatedFavorites {
  return {
    items: response.data,
    nextCursor: response.meta?.nextCursor ?? null,
    hasMore: response.meta?.hasMore ?? false,
  };
}
