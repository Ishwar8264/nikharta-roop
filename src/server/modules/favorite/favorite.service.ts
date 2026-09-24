import "server-only";

import {
  FavoriteAlreadyExistsError,
  FavoriteNotFoundError,
  FavoriteTargetNotFoundError,
} from "./favorite.errors";
import { toPublicFavorite } from "./favorite.mapper";
import {
  createFavorite,
  deleteFavorite,
  findFavoriteByIdForUser,
  findFavoriteByTarget,
  listUserFavorites,
  targetExists,
} from "./favorite.repository";
import type {
  AddFavoriteInput,
  FavoriteCheckResult,
  FavoriteTargetType,
  PaginatedFavorites,
  PublicFavorite,
} from "./favorite.types";

/** Lists the caller's favorites, optionally filtered by target type. */
export async function listFavorites(
  userId: string,
  query: { cursor?: string; limit: number; type?: FavoriteTargetType },
): Promise<PaginatedFavorites> {
  const result = await listUserFavorites(userId, query);
  return {
    items: result.items.map(toPublicFavorite),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Adds a favorite.
 *
 * Why:
 * The target existence check runs first so an invalid id returns 404 rather
 * than a Prisma foreign-key error. The unique constraint is the final guard
 * against duplicate inserts under concurrent requests.
 */
export async function addFavorite(
  userId: string,
  input: AddFavoriteInput,
): Promise<PublicFavorite> {
  const exists = await targetExists(input.type, input.targetId);
  if (!exists) throw new FavoriteTargetNotFoundError();

  const already = await findFavoriteByTarget(
    userId,
    input.type,
    input.targetId,
  );
  if (already) throw new FavoriteAlreadyExistsError();

  try {
    const row = await createFavorite({
      userId,
      type: input.type,
      targetId: input.targetId,
    });
    return toPublicFavorite(row);
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new FavoriteAlreadyExistsError();
    }
    throw error;
  }
}

/** Removes a favorite by its id. */
export async function removeFavorite(
  userId: string,
  favoriteId: string,
): Promise<void> {
  const row = await findFavoriteByIdForUser(favoriteId, userId);
  if (!row) throw new FavoriteNotFoundError();
  await deleteFavorite(favoriteId);
}

/**
 * Checks whether the given target is favorited by the caller.
 *
 * Why:
 * Lets the frontend render a filled or empty heart in one call without
 * paginating the user's entire favorites list.
 */
export async function checkFavorite(
  userId: string,
  type: FavoriteTargetType,
  targetId: string,
): Promise<FavoriteCheckResult> {
  const row = await findFavoriteByTarget(userId, type, targetId);
  return {
    isFavorited: row !== null,
    favoriteId: row?.id ?? null,
  };
}

/** Detects Prisma unique-constraint violation. */
function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
