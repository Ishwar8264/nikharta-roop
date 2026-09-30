import { notFound, redirect } from "next/navigation";

import { CreateServiceForm } from "@/features/service/create-service-form";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { ServiceNotFoundError } from "@/server/modules/service/service.errors";
import { getManagedSalonService, listAllServiceCategories } from "@/server/modules/service/service.service";

interface Props { params: Promise<{ slug: string; serviceId: string }> }

/** Loads a service for editing, including inactive services. */
export default async function EditServicePage({ params }: Props) {
  const { slug, serviceId } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(routes.salonServiceEdit(slug, serviceId))}`);

  let salon;
  let service;
  let categories;
  try {
    [salon, service, categories] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      getManagedSalonService(user.id, slug, serviceId),
      listAllServiceCategories(),
    ]);
  } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof SalonRoleInsufficientError || error instanceof ServiceNotFoundError) notFound();
    throw error;
  }

  return <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8"><CreateServiceForm salonName={salon.name} salonSlug={salon.slug} categories={categories} initialService={service} /></main>;
}
