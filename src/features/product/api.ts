import type { CatalogStatus } from "@/lib/catalog/status";
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
  const details: Partial<ProductFormValues> = { ...input };
  delete details.status;
  return api.post<{ message: string; data: { product: PublicProduct } }>(
    productPath(salonRef),
    details,
  );
}

/** Updates only the supplied product fields by internal id. */
export async function updateProductApi(salonRef: string, productId: string, input: Record<string, unknown>) {
  const { status, ...details } = input;
  let response;
  if (Object.keys(details).length) response = await api.patch<{ message: string; data: { product: PublicProduct } }>(productPath(salonRef, productId), details);
  if (status !== undefined) response = await updateProductStatusApi(salonRef, productId, status as CatalogStatus);
  if (!response) throw new Error("No product changes supplied");
  return response;
}

/** Updates publication independently from product details. */
export function updateProductStatusApi(salonRef: string, productId: string, status: CatalogStatus) {
  return api.patch<{ message: string; data: { product: PublicProduct } }>(`${productPath(salonRef, productId)}/status`, { status });
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
