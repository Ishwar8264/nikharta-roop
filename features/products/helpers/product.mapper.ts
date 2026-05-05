type DecimalLike = { toString(): string };

export type ProductCategoryRow = {
  branch: Record<string, unknown> | null;
  branchId: string | null;
  createdAt: Date;
  description: string | null;
  id: string;
  isActive: boolean;
  nameEn: string | null;
  nameHi: string;
  slug: string;
  slugScope: string;
  updatedAt: Date;
};

export type ProductRow = {
  branch: Record<string, unknown>;
  branchId: string;
  category: ProductCategoryRow | null;
  categoryId: string | null;
  createdAt: Date;
  descriptionHi: string | null;
  id: string;
  imageUrl: string | null;
  isActive: boolean;
  nameEn: string | null;
  nameHi: string;
  price: DecimalLike;
  slug: string;
  stockQuantity: number;
  updatedAt: Date;
};

/**
 * Converts a product category row into the public API shape.
 */
export function toPublicProductCategory(category: ProductCategoryRow) {
  return category;
}

/**
 * Converts a product row into the public API shape.
 */
export function toPublicProduct(product: ProductRow) {
  return {
    ...product,
    category: product.category ? toPublicProductCategory(product.category) : null,
    price: product.price.toString(),
  };
}
