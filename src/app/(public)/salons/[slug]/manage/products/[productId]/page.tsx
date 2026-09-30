import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { ProductForm } from "@/features/product/product-form";
import { getSession } from "@/lib/auth/get-session";
import { ProductNotFoundError } from "@/server/modules/product/product.errors";
import {
  getManagedSalonProduct,
  listAllProductCategories,
} from "@/server/modules/product/product.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface Props {
  params: Promise<{ slug: string; productId: string }>;
}

/** Loads active or inactive product data for an authorized manager. */
export default async function EditProductPage({ params }: Props) {
  const { slug, productId } = await params;
  const user = await getSession();
  if (!user)
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonProductEdit(slug, productId))}`,
    );
  let salon;
  let product;
  let categories;
  try {
    [salon, product, categories] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      getManagedSalonProduct(user.id, slug, productId),
      listAllProductCategories(),
    ]);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError ||
      error instanceof ProductNotFoundError
    )
      notFound();
    throw error;
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <ProductForm
        salonName={salon.name}
        salonSlug={salon.slug}
        categories={categories}
        initialProduct={product}
      />
    </main>
  );
}
