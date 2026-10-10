import "server-only";

import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonAccessDeniedError, SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";

import { slugExists } from "./slug.repository";
import { isSalonScoped, type SlugAvailabilityQuery } from "./slug.schema";

/** Availability is advisory; creation must still enforce the database unique constraint. */
export async function checkSlugAvailability(actor: { sub: string; role: string }, input: SlugAvailabilityQuery) {
  if (isSalonScoped(input.resource)) {
    if (!input.salonId) throw new Error("Salon ID is required");
    const salon = await findSalonForViewer({ salonId: input.salonId, userId: actor.sub });
    if (!salon) throw new SalonNotFoundError();
    assertRoleAtLeast(salon.viewerRole, "MANAGER");
  } else if (input.resource !== "salon" && actor.role !== "SUPER_ADMIN") {
    throw new SalonAccessDeniedError();
  }

  const reason = input.resource === "service" && input.slug === "create"
    ? "reserved" as const
    : await slugExists(input) ? "taken" as const : null;

  return {
    resource: input.resource,
    slug: input.slug,
    ...(input.salonId ? { salonId: input.salonId } : {}),
    available: reason === null,
    reason,
  };
}
