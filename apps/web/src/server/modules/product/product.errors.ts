/** Thrown when the requested product does not exist or was soft-deleted. */
export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
    this.name = "ProductNotFoundError";
  }
}

/** Thrown when a product category does not exist. */
export class ProductCategoryNotFoundError extends Error {
  constructor() {
    super("Product category not found");
    this.name = "ProductCategoryNotFoundError";
  }
}

/** Thrown when a product slug collides within the same salon. */
export class ProductSlugConflictError extends Error {
  constructor() {
    super("A product with this slug already exists in this salon");
    this.name = "ProductSlugConflictError";
  }
}

/** Thrown when a global product category slug collides. */
export class ProductCategorySlugConflictError extends Error {
  constructor() {
    super("A product category with this slug already exists");
    this.name = "ProductCategorySlugConflictError";
  }
}
