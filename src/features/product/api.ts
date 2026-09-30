import { api } from "@/lib/api/backend.client";

import type {
  PublicProduct,
  PublicCategory,
} from "@/server/modules/product/product.types";
import type { ProductFormValues } from "./schema";

const productPath = (salonRef: string, productId?: string) =>
  `/salons/${encodeURIComponent(salonRef)}/products${productId ? `/${encodeURIComponent(productId)}` : ""}`;

/** Creates a product in the selected salon. */
export function createProductApi(salonRef: string, input: ProductFormValues) {
  return api.post<{ message: string; data: { product: PublicProduct } }>(
    productPath(salonRef),
    input,
  );
}

/** Updates only the supplied product fields by internal id. */
export function updateProductApi(
  salonRef: string,
  productId: string,
  input: Record<string, unknown>,
) {
  return api.patch<{ message: string; data: { product: PublicProduct } }>(
    productPath(salonRef, productId),
    input,
  );
}

/** Soft deletes a product by internal id. */
export function deleteProductApi(salonRef: string, productId: string) {
  return api.delete<{ message: string; data: null }>(
    productPath(salonRef, productId),
  );
}

/** Creates a global product category for SUPER_ADMIN users. */
export function createProductCategoryApi(input: {
  name: string;
  slug?: string;
}) {
  return api.post<{ message: string; data: { category: PublicCategory } }>(
    "/products/categories",
    input,
  );
}
