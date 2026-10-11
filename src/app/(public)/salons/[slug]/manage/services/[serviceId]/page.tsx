import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { ServiceNotFoundError } from "@/server/modules/service/service.errors";
import { getManagedSalonService } from "@/server/modules/service/service.service";

interface Props { params: Promise<{ slug: string; serviceId: string }> }

/** Preserves authorized legacy edit links by redirecting to the slug route. */
export default async function EditServicePage({ params }: Props) {
  const { slug, serviceId } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/salons/${slug}/manage/services/${serviceId}`)}`);

  let service;
  try {
    service = await getManagedSalonService(user.id, slug, serviceId);
  } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof SalonRoleInsufficientError || error instanceof ServiceNotFoundError) notFound();
    throw error;
  }
  redirect(routes.salonServiceEdit(slug, service.slug));
}
