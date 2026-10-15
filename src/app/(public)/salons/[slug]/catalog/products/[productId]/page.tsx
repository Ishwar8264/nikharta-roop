import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { ProductNotFoundError } from "@/server/modules/product/product.errors";
import { getManagedSalonProduct } from "@/server/modules/product/product.service";

interface Props { params: Promise<{ slug: string; productId: string }> }

/** Preserves authorized legacy edit links by redirecting to the slug route. */
export default async function EditProductPage({ params }: Props) {
  const { slug, productId } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/salons/${slug}/catalog/products/${productId}`)}`);

  let product;
  try {
    product = await getManagedSalonProduct(user.id, slug, productId);
  } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof SalonRoleInsufficientError || error instanceof ProductNotFoundError) notFound();
    throw error;
  }
  redirect(routes.salonProductEdit(slug, product.slug));
}
