import type { Prisma } from "@prisma/client";

/**
 * Selects product category fields exposed by public and admin APIs.
 */
export const productCategorySelect = () =>
  ({
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    createdAt: true,
    description: true,
    id: true,
    isActive: true,
    nameEn: true,
    nameHi: true,
    slug: true,
    slugScope: true,
    updatedAt: true,
  }) satisfies Prisma.ProductCategorySelect;

/**
 * Selects product fields exposed by public and admin APIs.
 */
export const productSelect = () =>
  ({
    branch: { select: { city: true, id: true, nameEn: true, nameHi: true } },
    branchId: true,
    category: { select: productCategorySelect() },
    categoryId: true,
    createdAt: true,
    descriptionHi: true,
    id: true,
    imageUrl: true,
    isActive: true,
    nameEn: true,
    nameHi: true,
    price: true,
    slug: true,
    stockQuantity: true,
    updatedAt: true,
  }) satisfies Prisma.ProductSelect;
