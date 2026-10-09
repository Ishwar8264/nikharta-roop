import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { PackageForm } from "@/features/package/package-form";
import type { PackageServiceOption } from "@/features/package/types";
import { getSession } from "@/lib/auth/get-session";
import { PackageNotFoundError } from "@/server/modules/package/package.errors";
import { getManagedSalonPackage } from "@/server/modules/package/package.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { listSalonServices } from "@/server/modules/service/service.service";

export const metadata: Metadata = {
  title: "Edit package | Nikharta Roop",
};

interface Props {
  params: Promise<{ slug: string; packageId: string }>;
}

/**
 * Authorizes a manager and renders the package edit form.
 *
 * Why:
 * Loads the package by id (the URL value, same id the PATCH/DELETE endpoints
 * use) alongside the salon's active services, then hands both to the form.
 * Inactive packages stay editable so owners can tweak price or services before
 * re-activating them.
 */
export default async function EditPackagePage({ params }: Props) {
  const { slug, packageId } = await params;
  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        routes.salonPackageEdit(slug, packageId),
      )}`,
    );
  }

  let salon;
  let pkg;
  let servicesResult;
  try {
    [salon, pkg, servicesResult] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      getManagedSalonPackage(user.id, slug, packageId),
      listSalonServices(slug, { limit: 50, sortBy: "name", sortOrder: "asc" }),
    ]);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError ||
      error instanceof PackageNotFoundError
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
        initialPackage={pkg}
      />
    </main>
  );
}
