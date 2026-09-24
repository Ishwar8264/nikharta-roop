import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type { FavoriteTargetType } from "./favorite.types";

/** Shared select for a favorite row with all three optional relations. */
const FAVORITE_SELECT = {
  id: true,
  createdAt: true,
  salonId: true,
  serviceId: true,
  productId: true,
  salon: { select: { id: true, name: true, slug: true, images: true } },
  service: { select: { id: true, name: true, slug: true, images: true } },
  product: { select: { id: true, name: true, slug: true, images: true } },
} as const satisfies Prisma.FavoriteSelect;

/** Checks the target is available through the public catalogue. */
export async function targetExists(
  type: FavoriteTargetType,
  targetId: string,
): Promise<boolean> {
  if (type === "salon") {
    const row = await prisma.salon.findFirst({
      where: { id: targetId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    return row !== null;
  }
  if (type === "service") {
    const row = await prisma.service.findFirst({
      where: { id: targetId, isActive: true, deletedAt: null },
      select: { id: true },
    });
    return row !== null;
  }
  const row = await prisma.product.findFirst({
    where: { id: targetId, isActive: true, deletedAt: null },
    select: { id: true },
  });
  return row !== null;
}

/** Cursor-paginated list of the caller's favorites. */
export async function listUserFavorites(
  userId: string,
  input: { cursor?: string; limit: number; type?: FavoriteTargetType },
) {
  const where: Prisma.FavoriteWhereInput = {
    userId,
    ...(input.type === "salon" ? { salonId: { not: null } } : {}),
    ...(input.type === "service" ? { serviceId: { not: null } } : {}),
    ...(input.type === "product" ? { productId: { not: null } } : {}),
  };

  const rows = await prisma.favorite.findMany({
    where,
    select: FAVORITE_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Finds a favorite by its polymorphic target. */
export async function findFavoriteByTarget(
  userId: string,
  type: FavoriteTargetType,
  targetId: string,
) {
  const where: Prisma.FavoriteWhereInput = {
    userId,
    ...(type === "salon" ? { salonId: targetId } : {}),
    ...(type === "service" ? { serviceId: targetId } : {}),
    ...(type === "product" ? { productId: targetId } : {}),
  };

  return prisma.favorite.findFirst({
    where,
    select: { id: true },
  });
}

/** Loads a single favorite, scoped to the owner. */
export async function findFavoriteByIdForUser(
  favoriteId: string,
  userId: string,
) {
  return prisma.favorite.findFirst({
    where: { id: favoriteId, userId },
    select: FAVORITE_SELECT,
  });
}

/** Persists a new favorite row. */
export async function createFavorite(input: {
  userId: string;
  type: FavoriteTargetType;
  targetId: string;
}) {
  return prisma.favorite.create({
    data: {
      userId: input.userId,
      ...(input.type === "salon" ? { salonId: input.targetId } : {}),
      ...(input.type === "service" ? { serviceId: input.targetId } : {}),
      ...(input.type === "product" ? { productId: input.targetId } : {}),
    },
    select: FAVORITE_SELECT,
  });
}

/** Deletes a favorite row. */
export async function deleteFavorite(id: string): Promise<void> {
  await prisma.favorite.delete({ where: { id } });
}
