import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Columns and relations safe to return on every public service response. */
const PUBLIC_SERVICE_SELECT = {
  id: true,
  salonId: true,
  categoryId: true,
  category: {
    select: { id: true, name: true, slug: true, icon: true },
  },
  name: true,
  slug: true,
  price: true,
  duration: true,
  isActive: true,
  shortDescription: true,
  description: true,
  descriptionHtml: true,
  descriptionJson: true,
  images: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ServiceSelect;

/** Columns safe to return on every public category response. */
const PUBLIC_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  icon: true,
} as const satisfies Prisma.ServiceCategorySelect;

/**
 * Resolves a salon reference (slug or id) to its internal id.
 *
 * Why:
 * Public detail routes accept slugs for SEO while management routes accept
 * ids. Public reads can additionally require an active salon, while management
 * operations may still edit a temporarily inactive salon.
 */
export async function resolveSalonId(
  ref: string,
  activeOnly = false,
): Promise<string | null> {
  const salon = await prisma.salon.findFirst({
    where: {
      deletedAt: null,
      ...(activeOnly ? { isActive: true } : {}),
      OR: [{ id: ref }, { slug: ref }],
    },
    select: { id: true },
  });

  return salon?.id ?? null;
}

/**
 * Cursor-paginated list of active services for a salon.
 *
 * Why:
 * Fetches `limit + 1` rows to learn whether a next page exists without a
 * separate count query. The secondary `id: "asc"` sort keeps pagination
 * deterministic when the primary sort field has ties.
 */
export async function listServicesBySalon(
  salonId: string,
  input: {
    cursor?: string;
    limit: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy: "createdAt" | "price" | "duration" | "name";
    sortOrder: "asc" | "desc";
  },
) {
  const where: Prisma.ServiceWhereInput = {
    salonId,
    isActive: true,
    deletedAt: null,
    ...(input.category ? { category: { slug: input.category } } : {}),
    ...(input.search
      ? {
          OR: [
            { name: { contains: input.search, mode: "insensitive" } },
            {
              shortDescription: {
                contains: input.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(input.minPrice !== undefined || input.maxPrice !== undefined
      ? {
          price: {
            ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
            ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.service.findMany({
    where,
    select: PUBLIC_SERVICE_SELECT,
    orderBy: [{ [input.sortBy]: input.sortOrder }, { id: "asc" }],
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

/** Lists active and inactive, non-deleted services for salon management. */
export async function listManagedServicesBySalon(salonId: string, cursor?: string) {
  const rows = await prisma.service.findMany({
    where: { salonId, deletedAt: null },
    select: PUBLIC_SERVICE_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 51,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > 50;
  const items = hasMore ? rows.slice(0, 50) : rows;
  return { items, hasMore, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
}

/** Loads a single active service by slug within a salon. */
export async function findServiceBySlug(salonId: string, slug: string) {
  return prisma.service.findFirst({
    where: { salonId, slug, isActive: true, deletedAt: null },
    select: PUBLIC_SERVICE_SELECT,
  });
}

/** Loads a single service by id, excluding soft-deleted rows. */
export async function findServiceById(id: string) {
  return prisma.service.findFirst({
    where: { id, deletedAt: null },
    select: PUBLIC_SERVICE_SELECT,
  });
}

/** Returns true when the given slug is already used within the salon. */
export async function serviceSlugExistsInSalon(
  salonId: string,
  slug: string,
): Promise<boolean> {
  const found = await prisma.service.findFirst({
    where: { salonId, slug },
    select: { id: true },
  });
  return found !== null;
}

/** Returns true when a category with the given id exists. */
export async function categoryExists(id: string): Promise<boolean> {
  const found = await prisma.serviceCategory.findUnique({
    where: { id },
    select: { id: true },
  });
  return found !== null;
}

/** Persists a new service row. */
export async function createService(data: Prisma.ServiceUncheckedCreateInput) {
  return prisma.service.create({
    data,
    select: PUBLIC_SERVICE_SELECT,
  });
}

/** Applies a partial update to a service. */
export async function updateServiceById(
  id: string,
  data: Prisma.ServiceUncheckedUpdateInput,
) {
  return prisma.service.update({
    where: { id },
    data,
    select: PUBLIC_SERVICE_SELECT,
  });
}

/** Marks a service as soft-deleted and deactivates it. */
export async function softDeleteServiceById(id: string): Promise<void> {
  await prisma.service.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

/** Cursor-paginated list of global service categories. */
export async function listCategories(input: {
  cursor?: string;
  limit: number;
}) {
  const rows = await prisma.serviceCategory.findMany({
    select: PUBLIC_CATEGORY_SELECT,
    orderBy: [{ name: "asc" }, { id: "asc" }],
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

/** Returns true when the given category slug already exists. */
export async function categorySlugExists(slug: string): Promise<boolean> {
  const found = await prisma.serviceCategory.findUnique({
    where: { slug },
    select: { id: true },
  });
  return found !== null;
}

/** Persists a new global service category. */
export async function createCategory(data: {
  name: string;
  slug: string;
  icon: string | null;
}) {
  return prisma.serviceCategory.create({
    data,
    select: PUBLIC_CATEGORY_SELECT,
  });
}
