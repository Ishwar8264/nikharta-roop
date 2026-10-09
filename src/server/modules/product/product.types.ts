import type { z } from "zod";

import type {
  createCategorySchema,
  createProductSchema,
  listCategoriesQuerySchema,
  listProductsQuerySchema,
  updateProductSchema,
} from "./product.schema";

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

/** Category summary embedded in product responses. */
export interface PublicProductCategorySummary {
  id: string;
  name: string;
  slug: string;
}

/** Product row shape returned to public clients. */
export interface PublicProduct {
  id: string;
  salonId: string;
  categoryId: string | null;
  category: PublicProductCategorySummary | null;
  name: string;
  slug: string;
  price: number;
  stock: number;
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

/** Cursor-paginated products. */
export interface PaginatedProducts {
  items: PublicProduct[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Global product category. */
export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
}

/** Cursor-paginated categories. */
export interface PaginatedCategories {
  items: PublicCategory[];
  nextCursor: string | null;
  hasMore: boolean;
}
