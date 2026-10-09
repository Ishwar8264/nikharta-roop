import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { PackageForm } from "@/features/package/package-form";
import type { PackageServiceOption } from "@/features/package/types";
import { getSession } from "@/lib/auth/get-session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { listSalonServices } from "@/server/modules/service/service.service";

export const metadata: Metadata = {
  title: "New package | Nikharta Roop",
};

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Authorizes a manager and renders the package creation form.
 *
 * Why:
 * The form is a Client Component that mutates through the API; this Server
 * Component only loads the salon's active services and hands them to the
 * picker. Inactive services are intentionally excluded — customers can't book
 * them, so bundling them into a new package would be misleading.
 */
export default async function CreatePackagePage({ params }: Props) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonPackageCreate(slug))}`,
    );
  }

  let salon;
  let servicesResult;
  try {
    [salon, servicesResult] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      listSalonServices(slug, { limit: 50, sortBy: "name", sortOrder: "asc" }),
    ]);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  // Map the richer PublicService down to the minimal shape the picker needs.
  const services: PackageServiceOption[] = servicesResult.items.map(
    (service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration,
      isActive: service.isActive,
      category: service.category
        ? { id: service.category.id, name: service.category.name }
        : null,
    }),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PackageForm
        salonSlug={salon.slug}
        salonName={salon.name}
        services={services}
      />
    </main>
  );
}
