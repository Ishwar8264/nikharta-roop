import type { z } from "zod";

import type {
  createCategorySchema,
  createServiceSchema,
  listCategoriesQuerySchema,
  listServicesQuerySchema,
  updateServiceSchema,
} from "./service.schema";

export type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

/** Category summary embedded in service responses. */
export interface PublicServiceCategorySummary {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/** Service row shape returned to public clients. */
export interface PublicService {
  id: string;
  salonId: string;
  categoryId: string | null;
  category: PublicServiceCategorySummary | null;
  name: string;
  slug: string;
  price: number;
  duration: number;
  isActive: boolean;
  shortDescription: string | null;
  description: string | null;
  descriptionHtml: string | null;
  descriptionJson: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Cursor-paginated services. */
export interface PaginatedServices {
  items: PublicService[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Global service category. */
export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

/** Cursor-paginated categories. */
export interface PaginatedCategories {
  items: PublicCategory[];
  nextCursor: string | null;
  hasMore: boolean;
}
