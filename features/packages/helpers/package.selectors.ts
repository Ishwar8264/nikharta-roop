import type { Prisma } from "@prisma/client";

/**
 * Selects branch fields shown inside package cards.
 */
export function packageBranchSelect() {
  return {
    city: true,
    id: true,
    nameEn: true,
    nameHi: true,
  } as const;
}

/**
 * Selects package category fields shared by package responses.
 */
export function packageCategorySelect() {
  return {
    branchId: true,
    id: true,
    isActive: true,
    nameEn: true,
    nameHi: true,
    slug: true,
  } as const;
}

/**
 * Selects package fields for public list responses.
 */
export function packageSelect() {
  return {
    advanceAmount: true,
    branch: { select: packageBranchSelect() },
    branchId: true,
    category: { select: packageCategorySelect() },
    categoryId: true,
    createdAt: true,
    descriptionEn: true,
    descriptionHi: true,
    durationMinutes: true,
    id: true,
    imageUrl: true,
    isActive: true,
    isCustom: true,
    nameEn: true,
    nameHi: true,
    price: true,
    slug: true,
    updatedAt: true,
  } satisfies Prisma.PackageSelect;
}

/**
 * Selects package detail fields including attached services.
 */
export function packageDetailSelect(activeOnly = true) {
  return {
    ...packageSelect(),
    services: {
      orderBy: [{ sortOrder: "asc" }, { service: { nameHi: "asc" } }],
      select: packageServiceSelect(),
      where: { service: { isActive: activeOnly ? true : undefined } },
    },
  } satisfies Prisma.PackageSelect;
}

/**
 * Selects package-service join fields exposed in package detail APIs.
 */
function packageServiceSelect() {
  return {
    createdAt: true,
    quantity: true,
    service: {
      select: {
        durationMinutes: true,
        id: true,
        imageUrl: true,
        nameEn: true,
        nameHi: true,
        price: true,
        slug: true,
      },
    },
    serviceId: true,
    sortOrder: true,
  } as const;
}
