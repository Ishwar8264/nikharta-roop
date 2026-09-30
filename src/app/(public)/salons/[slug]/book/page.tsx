import { notFound } from "next/navigation";

import { BookingFlow } from "@/features/appointment/booking-flow";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { getSalonSummaryBySlug } from "@/server/modules/salon/salon.service";
import { listSalonServices } from "@/server/modules/service/service.service";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

/** Loads the public booking inputs and hands interaction to the client flow. */
export default async function SalonBookingPage({ params, searchParams }: PageProps) {
  const [{ slug }, { service }] = await Promise.all([params, searchParams]);

  let salon;
  let result;
  try {
    [salon, result] = await Promise.all([
      getSalonSummaryBySlug(slug),
      listSalonServices(slug, { limit: 50, sortBy: "name", sortOrder: "asc" }),
    ]);

  } catch (error) {
    if (error instanceof SalonNotFoundError) notFound();
    throw error;
  }

  return (
    <BookingFlow
      salon={{ id: salon.id, name: salon.name, slug: salon.slug, timezone: salon.timezone }}
      services={result.items.map(({ id, name, slug: serviceSlug, price, duration }) => ({ id, name, slug: serviceSlug, price, duration }))}
      initialServiceSlug={service}
    />
  );
}
