type DecimalLike = {
  toString(): string;
};

type ServiceCategoryRow = {
  branchId: string | null;
  createdAt: Date;
  description: string | null;
  id: string;
  isActive: boolean;
  nameEn: string;
  nameHi: string;
  slug: string;
  sortOrder: number;
  updatedAt: Date;
};

type ServiceBranchRow = {
  city: string;
  id: string;
  nameEn: string | null;
  nameHi: string;
};

type ServiceVariantRow = {
  advanceAmount: DecimalLike | null;
  createdAt: Date;
  descriptionHi: string | null;
  durationMinutes: number;
  id: string;
  isActive: boolean;
  nameEn: string | null;
  nameHi: string;
  price: DecimalLike;
  sortOrder: number;
  updatedAt: Date;
};

type ServiceAddOnRow = {
  createdAt: Date;
  descriptionHi: string | null;
  durationMinutes: number;
  id: string;
  isActive: boolean;
  nameEn: string | null;
  nameHi: string;
  price: DecimalLike;
  updatedAt: Date;
};

type ServiceRow = {
  advanceAmount: DecimalLike | null;
  branch: ServiceBranchRow;
  branchId: string;
  category: ServiceCategoryRow;
  categoryId: string;
  createdAt: Date;
  descriptionEn: string | null;
  descriptionHi: string;
  durationMinutes: number;
  galleryUrls: string[];
  id: string;
  imageUrl: string | null;
  isActive: boolean;
  nameEn: string;
  nameHi: string;
  price: DecimalLike;
  slug: string;
  updatedAt: Date;
};

type ServiceDetailRow = ServiceRow & {
  addOns: ServiceAddOnRow[];
  variants: ServiceVariantRow[];
};

/**
 * Converts a service category row into the public discovery API shape.
 */
export function toPublicServiceCategory(category: ServiceCategoryRow) {
  return {
    branchId: category.branchId,
    createdAt: category.createdAt,
    description: category.description,
    id: category.id,
    isActive: category.isActive,
    nameEn: category.nameEn,
    nameHi: category.nameHi,
    slug: category.slug,
    sortOrder: category.sortOrder,
    updatedAt: category.updatedAt,
  };
}

/**
 * Converts a Service row into the list-card API shape.
 */
export function toPublicService(service: ServiceRow) {
  return {
    advanceAmount: service.advanceAmount?.toString() ?? null,
    branch: service.branch,
    branchId: service.branchId,
    category: toPublicServiceCategory(service.category),
    categoryId: service.categoryId,
    createdAt: service.createdAt,
    descriptionEn: service.descriptionEn,
    descriptionHi: service.descriptionHi,
    durationMinutes: service.durationMinutes,
    galleryUrls: service.galleryUrls,
    id: service.id,
    imageUrl: service.imageUrl,
    isActive: service.isActive,
    nameEn: service.nameEn,
    nameHi: service.nameHi,
    price: service.price.toString(),
    slug: service.slug,
    updatedAt: service.updatedAt,
  };
}

/**
 * Converts a Service row with children into the detail API shape.
 */
export function toPublicServiceDetail(service: ServiceDetailRow) {
  return {
    ...toPublicService(service),
    addOns: service.addOns.map(toPublicServiceAddOn),
    variants: service.variants.map(toPublicServiceVariant),
  };
}

/**
 * Converts an active service add-on into an API-safe shape.
 */
function toPublicServiceAddOn(addOn: ServiceAddOnRow) {
  return {
    createdAt: addOn.createdAt,
    descriptionHi: addOn.descriptionHi,
    durationMinutes: addOn.durationMinutes,
    id: addOn.id,
    isActive: addOn.isActive,
    nameEn: addOn.nameEn,
    nameHi: addOn.nameHi,
    price: addOn.price.toString(),
    updatedAt: addOn.updatedAt,
  };
}

/**
 * Converts an active service variant into an API-safe shape.
 */
function toPublicServiceVariant(variant: ServiceVariantRow) {
  return {
    advanceAmount: variant.advanceAmount?.toString() ?? null,
    createdAt: variant.createdAt,
    descriptionHi: variant.descriptionHi,
    durationMinutes: variant.durationMinutes,
    id: variant.id,
    isActive: variant.isActive,
    nameEn: variant.nameEn,
    nameHi: variant.nameHi,
    price: variant.price.toString(),
    sortOrder: variant.sortOrder,
    updatedAt: variant.updatedAt,
  };
}
