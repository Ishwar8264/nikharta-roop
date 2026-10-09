/**
 * Browser-safe mirror of `src/server/modules/package/package.types.ts`.
 */
export interface PublicPackage {
  id: string;
  salonId: string;
  name: string;
  slug: string;
  price: number;
  duration: number;
  isActive: boolean;
  services: Array<{
    serviceId: string;
    service: { id: string; name: string; slug: string; price: number };
  }>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginatedPackages {
  items: PublicPackage[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Minimal service shape the package form's multi-select needs. */
export interface PackageServiceOption {
  id: string;
  name: string;
  price: number;
  duration: number;
  isActive: boolean;
  category: { id: string; name: string } | null;
}

