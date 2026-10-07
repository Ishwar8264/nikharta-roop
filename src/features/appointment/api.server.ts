import "server-only";

import { getSession } from "@/lib/auth/get-session";
import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
} from "@/server/modules/appointment/appointment.errors";
import {
  getAppointment as getAppointmentFromService,
  listMyAppointments,
} from "@/server/modules/appointment/appointment.service";

import type { AppointmentStatus, PublicAppointment } from "./types";

/**
 * Loads the authenticated customer's appointment list.
 *
 * Why the service layer instead of self-fetching /api/v1:
 * This module runs inside Server Components — the same Node.js process as the
 * service. Calling the service directly skips an HTTP round trip, cookie
 * forwarding, and JSON re-serialization. The API routes stay for external
 * (browser/mobile) clients only.
 */
export async function listAppointments(input: {
  cursor?: string;
  status?: AppointmentStatus;
}): Promise<{
  items: PublicAppointment[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const user = await getSession();
  if (!user) {
    // The proxy redirects unauthenticated page visits to /login, so this is
    // only a defensive fallback.
    return { items: [], nextCursor: null, hasMore: false };
  }

  return listMyAppointments(user.id, {
    cursor: input.cursor,
    limit: 20,
    status: input.status,
  });
}

/**
 * Loads one appointment the caller is allowed to view.
 *
 * Returns null for appointments that do not exist or belong to someone else,
 * matching the "existence and ownership share one response" convention of the
 * REST endpoint, so callers can render notFound() uniformly.
 */
export async function getAppointment(
  id: string,
): Promise<PublicAppointment | null> {
  const user = await getSession();
  if (!user) return null;

  try {
    return await getAppointmentFromService(user.id, id);
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) return null;
    if (error instanceof AppointmentAccessDeniedError) return null;
    throw error;
  }
}
