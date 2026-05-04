import type { Prisma } from "@prisma/client";

/**
 * Selects public category fields shared by category and service responses.
 */
export function serviceCategorySelect() {
  return {
    branchId: true,
    createdAt: true,
    description: true,
    id: true,
    isActive: true,
    nameEn: true,
    nameHi: true,
    slug: true,
    sortOrder: true,
    updatedAt: true,
  } as const;
}

/**
 * Selects branch fields shown inside service cards.
 */
export function serviceBranchSelect() {
  return {
    city: true,
    id: true,
    nameEn: true,
    nameHi: true,
  } as const;
}

/**
 * Selects public service fields for list responses.
 */
export function serviceSelect() {
  return {
    advanceAmount: true,
    branch: {
      select: serviceBranchSelect(),
    },
    branchId: true,
    category: {
      select: serviceCategorySelect(),
    },
    categoryId: true,
    createdAt: true,
    descriptionEn: true,
    descriptionHi: true,
    durationMinutes: true,
    galleryUrls: true,
    id: true,
    imageUrl: true,
    isActive: true,
    nameEn: true,
    nameHi: true,
    price: true,
    slug: true,
    updatedAt: true,
  } satisfies Prisma.ServiceSelect;
}

/**
 * Selects service detail fields including variants and add-ons.
 */
export function serviceDetailSelect(activeOnly = true) {
  return {
    ...serviceSelect(),
    addOns: {
      orderBy: [{ nameHi: "asc" }],
      select: serviceAddOnSelect(),
      where: { isActive: activeOnly ? true : undefined },
    },
    variants: {
      orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
      select: serviceVariantSelect(),
      where: { isActive: activeOnly ? true : undefined },
    },
  } satisfies Prisma.ServiceSelect;
}

/**
 * Selects service add-on fields shown inside service details.
 */
function serviceAddOnSelect() {
  return {
    createdAt: true,
    descriptionHi: true,
    durationMinutes: true,
    id: true,
    isActive: true,
    nameEn: true,
    nameHi: true,
    price: true,
    updatedAt: true,
  } as const;
}

/**
 * Selects service variant fields shown inside service details.
 */
function serviceVariantSelect() {
  return {
    advanceAmount: true,
    createdAt: true,
    descriptionHi: true,
    durationMinutes: true,
    id: true,
    isActive: true,
    nameEn: true,
    nameHi: true,
    price: true,
    sortOrder: true,
    updatedAt: true,
  } as const;
}
