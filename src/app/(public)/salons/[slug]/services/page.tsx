import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowRight, Plus, Scissors } from "lucide-react";

import { BackButton } from "@/components/shared/back-button";
import { EmptyState } from "@/components/shared/empty-state";
import { NavLink } from "@/components/shared/nav-link";
import { routes } from "@/config/routes";
import { SalonServiceCard } from "@/features/salon/components/details/service-card";
import { getSession } from "@/lib/auth/get-session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import {
  getSalonForServiceManagement,
  getSalonSummaryBySlug,
} from "@/server/modules/salon/salon.service";
import { listSalonServices } from "@/server/modules/service/service.service";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

const getSalon = cache(getSalonSummaryBySlug);

/** Builds metadata from the same active salon contract as the page. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const salon = await getSalon(slug);
    return {
      title: `Services at ${salon.name}`,
      description: `Browse services, prices and durations at ${salon.name}.`,
    };
  } catch {
    return { title: "Salon services not found" };
  }
}

/** Lists a salon's complete active service catalogue with cursor pagination. */
export default async function SalonServicesPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, { cursor }] = await Promise.all([params, searchParams]);
  if (cursor && !isResourceId(cursor)) notFound();

  let salon;
  let result;
  let user;
  try {
    [salon, result, user] = await Promise.all([
      getSalon(slug),
      listSalonServices(slug, {
        cursor,
        limit: 24,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
      getSession(),
    ]);
  } catch (error) {
    if (error instanceof SalonNotFoundError) notFound();
    throw error;
  }

  let canManageServices = false;
  if (user) {
    try {
      await getSalonForServiceManagement(slug, user.id);
      canManageServices = true;
    } catch (error) {
      if (
        !(error instanceof SalonNotFoundError) &&
        !(error instanceof SalonRoleInsufficientError)
      ) {
        throw error;
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <BackButton href={routes.salonDetail(slug)} variant="secondary" />

      <header className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {salon.name}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Services
          </h1>
          <p className="mt-3 text-muted-foreground">
            Browse available treatments, prices and appointment durations.
          </p>
        </div>
        {canManageServices ? (
          <div className="flex flex-wrap gap-2">
            <NavLink href={routes.salonServicesManage(slug)} variant="outline" markActive={false}>Manage services</NavLink>
            <NavLink href={routes.salonServiceCreate(slug)} variant="default" markActive={false} icon={<Plus className="h-4 w-4" />}>Add service</NavLink>
          </div>
        ) : null}
      </header>

      {user?.role === "SUPER_ADMIN" ? <NavLink href={routes.serviceCategoriesManage} markActive={false} className="mt-4 inline-flex text-sm text-primary">Manage global categories</NavLink> : null}

      {result.items.length > 0 ? (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((service) => (
              <SalonServiceCard
                key={service.id}
                salonSlug={slug}
                service={service}
              />
            ))}
          </div>

          {result.hasMore && result.nextCursor ? (
            <div className="mt-8 flex justify-center">
              <NavLink
                href={`${routes.salonServices(slug)}?cursor=${encodeURIComponent(result.nextCursor)}`}
                variant="outline"
                markActive={false}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                View more services
              </NavLink>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={Scissors}
          title="No services available"
          description="This salon has not published any services yet."
        />
      )}
    </main>
  );
}
