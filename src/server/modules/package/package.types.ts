import type { z } from "zod";

import type {
  createPackageSchema,
  listPackagesQuerySchema,
  updatePackageSchema,
} from "./package.schema";

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type ListPackagesQuery = z.infer<typeof listPackagesQuerySchema>;

/** Package row returned to public clients. */
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
    service: { id: string; name: string; slug: string };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/** Cursor-paginated package list. */
export interface PaginatedPackages {
  items: PublicPackage[];
  nextCursor: string | null;
  hasMore: boolean;
}
