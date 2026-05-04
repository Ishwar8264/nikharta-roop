type DecimalLike = {
  toString(): string;
};

type PackageBranchRow = {
  city: string;
  id: string;
  nameEn: string | null;
  nameHi: string;
};

type PackageCategoryRow = {
  branchId: string | null;
  id: string;
  isActive: boolean;
  nameEn: string;
  nameHi: string;
  slug: string;
} | null;

type PackageServiceRow = {
  createdAt: Date;
  quantity: number;
  service: {
    durationMinutes: number;
    id: string;
    imageUrl: string | null;
    nameEn: string;
    nameHi: string;
    price: DecimalLike;
    slug: string;
  };
  serviceId: string;
  sortOrder: number;
};

type PackageRow = {
  advanceAmount: DecimalLike | null;
  branch: PackageBranchRow;
  branchId: string;
  category: PackageCategoryRow;
  categoryId: string | null;
  createdAt: Date;
  descriptionEn: string | null;
  descriptionHi: string | null;
  durationMinutes: number | null;
  id: string;
  imageUrl: string | null;
  isActive: boolean;
  isCustom: boolean;
  nameEn: string | null;
  nameHi: string;
  price: DecimalLike;
  slug: string;
  updatedAt: Date;
};

type PackageDetailRow = PackageRow & {
  services: PackageServiceRow[];
};

export function toPublicPackage(pkg: PackageRow) {
  return {
    advanceAmount: pkg.advanceAmount?.toString() ?? null,
    branch: pkg.branch,
    branchId: pkg.branchId,
    category: pkg.category,
    categoryId: pkg.categoryId,
    createdAt: pkg.createdAt,
    descriptionEn: pkg.descriptionEn,
    descriptionHi: pkg.descriptionHi,
    durationMinutes: pkg.durationMinutes,
    id: pkg.id,
    imageUrl: pkg.imageUrl,
    isActive: pkg.isActive,
    isCustom: pkg.isCustom,
    nameEn: pkg.nameEn,
    nameHi: pkg.nameHi,
    price: pkg.price.toString(),
    slug: pkg.slug,
    updatedAt: pkg.updatedAt,
  };
}

export function toPublicPackageDetail(pkg: PackageDetailRow) {
  return {
    ...toPublicPackage(pkg),
    services: pkg.services.map(toPublicPackageService),
  };
}

function toPublicPackageService(item: PackageServiceRow) {
  return {
    createdAt: item.createdAt,
    quantity: item.quantity,
    service: {
      ...item.service,
      price: item.service.price.toString(),
    },
    serviceId: item.serviceId,
    sortOrder: item.sortOrder,
  };
}
