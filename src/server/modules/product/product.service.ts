import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { generateUniqueSlug } from "@/lib/slug";
import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { resolveSalonId } from "@/server/modules/service/service.repository";

import {
  ProductCategoryNotFoundError,
  ProductCategorySlugConflictError,
  ProductNotFoundError,
  ProductSlugConflictError,
} from "./product.errors";
import { toPublicProduct } from "./product.mapper";
import {
  categoryExists,
  categorySlugExists,
  createCategory,
  createProduct,
  findProductById,
  findProductBySlug,
  listCategories,
  listProductsBySalon,
  productSlugExistsInSalon,
  softDeleteProductById,
  updateProductById,
} from "./product.repository";
import type {
  CreateCategoryInput,
  CreateProductInput,
  ListCategoriesQuery,
  ListProductsQuery,
  PaginatedCategories,
  PaginatedProducts,
  PublicCategory,
  PublicProduct,
  UpdateProductInput,
} from "./product.types";

/**
 * Public list of products for a salon identified by slug or id.
 *
 * Why:
 * Anonymous visitors must be able to browse a salon's catalogue before they
 * sign up. Only active, non-deleted products are returned.
 */
export async function listSalonProducts(
  salonRef: string,
  query: ListProductsQuery,
): Promise<PaginatedProducts> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const result = await listProductsBySalon(salonId, query);

  return {
    items: result.items.map(toPublicProduct),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/** Public detail lookup of a single product by slug within a salon. */
export async function getSalonProduct(
  salonRef: string,
  slug: string,
): Promise<PublicProduct> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const product = await findProductBySlug(salonId, slug);
  if (!product) throw new ProductNotFoundError();

  return toPublicProduct(product);
}

/**
 * Creates a product inside a salon the caller manages.
 *
 * Why:
 * Authorization is inherited from the parent salon — the caller must be at
 * least MANAGER on it. Slug uniqueness is scoped to the salon, so two salons
 * can both sell a product called "shampoo". Category existence is validated
 * first so a stale category id surfaces as a 404 rather than a Prisma FK error.
 */
export async function createSalonProduct(
  actorId: string,
  salonRef: string,
  input: CreateProductInput,
): Promise<PublicProduct> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: actorId });
  if (!salon) throw new SalonNotFoundError();
  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  if (input.categoryId) {
    const exists = await categoryExists(input.categoryId);
    if (!exists) throw new ProductCategoryNotFoundError();
  }

  const slug = input.slug ?? (await generateSlugOrFail(salonId, input.name));

  if (input.slug) {
    const taken = await productSlugExistsInSalon(salonId, input.slug);
    if (taken) throw new ProductSlugConflictError();
  }

  try {
    const created = await createProduct({
      salonId,
      categoryId: input.categoryId ?? null,
      name: input.name,
      slug,
      price: input.price,
      stock: input.stock,
      isActive: input.isActive,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      descriptionHtml: input.descriptionHtml ?? null,
      descriptionJson: input.descriptionJson ?? null,
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      images: input.images,
    });

    return toPublicProduct(created);
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      throw new ProductSlugConflictError();
    }
    throw error;
  }
}

/** Applies a partial update to a product. Requires MANAGER on the salon. */
export async function updateSalonProduct(
  actorId: string,
  salonRef: string,
  productRef: string,
  input: UpdateProductInput,
): Promise<PublicProduct> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: actorId });
  if (!salon) throw new SalonNotFoundError();
  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  const existing = await findProductById(productRef);
  if (!existing || existing.salonId !== salonId) {
    throw new ProductNotFoundError();
  }

  if (input.categoryId) {
    const exists = await categoryExists(input.categoryId);
    if (!exists) throw new ProductCategoryNotFoundError();
  }

  // Slug change requires a fresh collision check within the same salon.
  if (input.slug !== undefined && input.slug !== existing.slug) {
    const taken = await productSlugExistsInSalon(salonId, input.slug);
    if (taken) throw new ProductSlugConflictError();
  }

  const data: Prisma.ProductUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.price !== undefined) data.price = input.price;
  if (input.stock !== undefined) data.stock = input.stock;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.shortDescription !== undefined) {
    data.shortDescription = input.shortDescription;
  }
  if (input.description !== undefined) data.description = input.description;
  if (input.descriptionHtml !== undefined) {
    data.descriptionHtml = input.descriptionHtml;
  }
  if (input.descriptionJson !== undefined) {
    data.descriptionJson = input.descriptionJson;
  }
  if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) {
    data.seoDescription = input.seoDescription;
  }
  if (input.images !== undefined) data.images = input.images;

  try {
    const updated = await updateProductById(productRef, data);
    return toPublicProduct(updated);
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      throw new ProductSlugConflictError();
    }
    throw error;
  }
}

/** Soft-deletes a product. Requires MANAGER on the parent salon. */
export async function deleteSalonProduct(
  actorId: string,
  salonRef: string,
  productRef: string,
): Promise<void> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: actorId });
  if (!salon) throw new SalonNotFoundError();
  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  const existing = await findProductById(productRef);
  if (!existing || existing.salonId !== salonId) {
    throw new ProductNotFoundError();
  }

  await softDeleteProductById(productRef);
}

/** Public list of global product categories. */
export async function listProductCategories(
  query: ListCategoriesQuery,
): Promise<PaginatedCategories> {
  return listCategories(query);
}

/**
 * Creates a global product category. SUPER_ADMIN only.
 *
 * Why:
 * Categories are shared across every salon, so only platform administrators
 * can introduce new ones — otherwise a single salon could flood the shared
 * vocabulary with duplicates.
 */
export async function createProductCategory(
  input: CreateCategoryInput,
): Promise<PublicCategory> {
  const slug = input.slug ?? (await generateCategorySlugOrFail(input.name));

  if (input.slug) {
    const taken = await categorySlugExists(input.slug);
    if (taken) throw new ProductCategorySlugConflictError();
  }

  try {
    return await createCategory({ name: input.name, slug });
  } catch (error) {
    if (isUniqueConstraintViolation(error, "slug")) {
      throw new ProductCategorySlugConflictError();
    }
    throw error;
  }
}

/** Generates a unique product slug within the target salon. */
async function generateSlugOrFail(
  salonId: string,
  name: string,
): Promise<string> {
  try {
    return await generateUniqueSlug(
      name,
      (candidate) => productSlugExistsInSalon(salonId, candidate),
      "product",
    );
  } catch {
    throw new ProductSlugConflictError();
  }
}

/** Generates a unique global product-category slug. */
async function generateCategorySlugOrFail(name: string): Promise<string> {
  try {
    return await generateUniqueSlug(name, categorySlugExists, "category");
  } catch {
    throw new ProductCategorySlugConflictError();
  }
}

/** Checks whether Prisma reported a conflict for a specific unique field. */
function isUniqueConstraintViolation(error: unknown, field: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;

  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes(field);
  return typeof target === "string" && target.includes(field);
}
