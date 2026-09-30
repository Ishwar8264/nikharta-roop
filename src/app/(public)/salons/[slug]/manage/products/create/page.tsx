import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { ProductForm } from "@/features/product/product-form";
import { getSession } from "@/lib/auth/get-session";
import { listAllProductCategories } from "@/server/modules/product/product.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Protects and renders product creation for salon managers. */
export default async function CreateProductPage({ params }: Props) {
  const { slug } = await params;
  const user = await getSession();
  if (!user)
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonProductCreate(slug))}`,
    );
  let salon;
  try {
    salon = await getSalonForServiceManagement(slug, user.id);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    )
      notFound();
    throw error;
  }
  const categories = await listAllProductCategories();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <ProductForm
        salonName={salon.name}
        salonSlug={salon.slug}
        categories={categories}
      />
    </main>
  );
}
