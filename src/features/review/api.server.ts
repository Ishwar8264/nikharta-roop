import "server-only";

import { getSession } from "@/lib/auth/get-session";
import {
  ReviewAppointmentNotFoundError,
  ReviewNotAppointmentCustomerError,
} from "@/server/modules/review/review.errors";
import { listStaffRatingsForAppointment } from "@/server/modules/review/review.service";

import type { PublicStaffRating } from "./types";

/**
 * Loads the caller's staff ratings for one appointment, for server rendering.
 *
 * Why call the service directly (per the appointment `api.server.ts` pattern):
 * The appointment detail page is a Server Component running in the same
 * process as the service. An HTTP self-fetch would round-trip through cookies
 * and JSON re-serialization for no benefit; the service still runs the
 * customer-ownership check, so this is not a trust bypass.
 *
 * Why defensive empty-list returns:
 * The page already gates the main content via `getAppointment` + `notFound()`,
 * so by the time this runs the appointment is known to exist for the caller.
 * The catch is defense in depth for races (the appointment is deleted or the
 * caller's session lapses between the two calls) — a broken rating card must
 * never break the rest of the page.
 *
 * Why `createdAt` is serialized to ISO strings here:
 * The service returns `Date` objects (server types). The client
 * `PublicStaffRating` shape uses `string` for `createdAt` because the same
 * type also describes the JSON HTTP response. Mapping here keeps one
 * consistent wire shape on both paths.
 */
export async function listStaffRatingsForAppointmentServer(
  appointmentId: string,
): Promise<PublicStaffRating[]> {
  const user = await getSession();
  if (!user) return [];

  try {
    const ratings = await listStaffRatingsForAppointment(user.id, appointmentId);
    return ratings.map((rating) => ({
      ...rating,
      createdAt: rating.createdAt.toISOString(),
    }));
  } catch (error) {
    if (error instanceof ReviewAppointmentNotFoundError) return [];
    if (error instanceof ReviewNotAppointmentCustomerError) return [];
    throw error;
  }
}
