import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { listManagedSalonServices } from "@/server/modules/service/service.service";

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ cursor?: string }> }

/** Shows active and inactive services to salon managers. */
export default async function ManageServicesPage({ params, searchParams }: Props) {
  const [{ slug }, { cursor }] = await Promise.all([params, searchParams]);
  if (cursor && !isResourceId(cursor)) notFound();
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(routes.salonServicesManage(slug))}`);

  let salon;
  let services;
  try {
    [salon, services] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      listManagedSalonServices(user.id, slug, cursor),
    ]);
  } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof SalonRoleInsufficientError) notFound();
    throw error;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={routes.salonServices(slug)} className="text-sm text-primary underline">Public catalogue</Link>
          <h1 className="mt-3 font-heading text-3xl font-semibold">Manage services</h1>
          <p className="mt-2 text-muted-foreground">{salon.name}</p>
        </div>
        <Button render={<Link href={routes.salonServiceCreate(slug)} />}>Add service</Button>
      </header>
      {services.items.length === 0 ? <p className="rounded-xl border p-6 text-muted-foreground">No services yet.</p> : (
        <ul className="divide-y rounded-xl border">
          {services.items.map((service) => (
            <li key={service.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2"><span className="font-medium">{service.name}</span><Badge variant="secondary">{service.isActive ? "Active" : "Inactive"}</Badge></div>
                <p className="mt-1 text-sm text-muted-foreground">{service.duration} min · {service.category?.name ?? "Uncategorized"}</p>
              </div>
              <Button variant="outline" render={<Link href={routes.salonServiceEdit(slug, service.id)} />}>Edit</Button>
            </li>
          ))}
        </ul>
      )}
      {services.hasMore && services.nextCursor ? <Link className="inline-block text-primary underline" href={`${routes.salonServicesManage(slug)}?cursor=${encodeURIComponent(services.nextCursor)}`}>More services</Link> : null}
    </main>
  );
}
