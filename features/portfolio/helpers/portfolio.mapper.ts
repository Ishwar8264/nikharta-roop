type PortfolioRelation = Record<string, unknown> | null;

export type PortfolioRow = {
  afterImageUrl: string | null;
  beforeImageUrl: string | null;
  branch: PortfolioRelation;
  branchId: string;
  createdAt: Date;
  descriptionHi: string | null;
  id: string;
  imageUrls: string[];
  isFeatured: boolean;
  isPublished: boolean;
  package: PortfolioRelation;
  packageId: string | null;
  service: PortfolioRelation;
  serviceId: string | null;
  sortOrder: number;
  staff: PortfolioRelation;
  staffId: string | null;
  titleHi: string | null;
  updatedAt: Date;
};

/**
 * Converts a portfolio row into the public API shape.
 */
export function toPublicPortfolioItem(item: PortfolioRow) {
  return {
    afterImageUrl: item.afterImageUrl,
    beforeImageUrl: item.beforeImageUrl,
    branch: item.branch,
    branchId: item.branchId,
    createdAt: item.createdAt,
    descriptionHi: item.descriptionHi,
    id: item.id,
    imageUrls: item.imageUrls,
    isFeatured: item.isFeatured,
    isPublished: item.isPublished,
    package: item.package,
    packageId: item.packageId,
    service: item.service,
    serviceId: item.serviceId,
    sortOrder: item.sortOrder,
    staff: item.staff,
    staffId: item.staffId,
    titleHi: item.titleHi,
    updatedAt: item.updatedAt,
  };
}
