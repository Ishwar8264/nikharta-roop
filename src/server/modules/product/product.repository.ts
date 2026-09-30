import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Columns and relations safe to return on every public product response. */
const PUBLIC_PRODUCT_SELECT = {
  id: true,
  salonId: true,
  categoryId: true,
  category: {
    select: { id: true, name: true, slug: true },
  },
  name: true,
  slug: true,
  price: true,
  stock: true,
  isActive: true,
  shortDescription: true,
  description: true,
  descriptionHtml: true,
  descriptionJson: true,
  images: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ProductSelect;

/** Columns safe to return on every public category response. */
const PUBLIC_CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
} as const satisfies Prisma.ProductCategorySelect;

/**
 * Cursor-paginated list of active products for a salon.
 *
 * Why:
 * Fetches `limit + 1` rows to learn whether a next page exists without a
 * separate count query. The secondary `id: "asc"` sort keeps pagination
 * deterministic when the primary sort field has ties.
 */
export async function listProductsBySalon(
  salonId: string,
  input: {
    cursor?: string;
    limit: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy: "createdAt" | "price" | "name";
    sortOrder: "asc" | "desc";
  },
) {
  const where: Prisma.ProductWhereInput = {
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
    ...(input.inStock !== undefined
      ? input.inStock
        ? { stock: { gt: 0 } }
        : { stock: { lte: 0 } }
      : {}),
  };

  const rows = await prisma.product.findMany({
    where,
    select: PUBLIC_PRODUCT_SELECT,
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

/** Loads a single active product by slug within a salon. */
export async function findProductBySlug(salonId: string, slug: string) {
  return prisma.product.findFirst({
    where: { salonId, slug, isActive: true, deletedAt: null },
    select: PUBLIC_PRODUCT_SELECT,
  });
}

/** Loads a single product by id, excluding soft-deleted rows. */
export async function findProductById(id: string) {
  return prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: PUBLIC_PRODUCT_SELECT,
  });
}

/** Returns true when the given slug is already used within the salon. */
export async function productSlugExistsInSalon(
  salonId: string,
  slug: string,
): Promise<boolean> {
  const found = await prisma.product.findFirst({
    where: { salonId, slug },
    select: { id: true },
  });
  return found !== null;
}

/** Returns true when a product category with the given id exists. */
export async function categoryExists(id: string): Promise<boolean> {
  const found = await prisma.productCategory.findUnique({
    where: { id },
    select: { id: true },
  });
  return found !== null;
}

/** Persists a new product row. */
export async function createProduct(data: Prisma.ProductUncheckedCreateInput) {
  return prisma.product.create({
    data,
    select: PUBLIC_PRODUCT_SELECT,
  });
}

/** Applies a partial update to a product. */
export async function updateProductById(
  id: string,
  data: Prisma.ProductUncheckedUpdateInput,
) {
  return prisma.product.update({
    where: { id },
    data,
    select: PUBLIC_PRODUCT_SELECT,
  });
}

/** Marks a product as soft-deleted and deactivates it. */
export async function softDeleteProductById(id: string): Promise<void> {
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

/** Cursor-paginated list of global product categories. */
export async function listCategories(input: {
  cursor?: string;
  limit: number;
}) {
  const rows = await prisma.productCategory.findMany({
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
  const found = await prisma.productCategory.findUnique({
    where: { slug },
    select: { id: true },
  });
  return found !== null;
}

/** Persists a new global product category. */
export async function createCategory(data: { name: string; slug: string }) {
  return prisma.productCategory.create({
    data,
    select: PUBLIC_CATEGORY_SELECT,
  });
}
