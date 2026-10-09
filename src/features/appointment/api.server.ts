import "server-only";

import { getSession } from "@/lib/auth/get-session";
import type { PaymentTransaction } from "@/features/payment/types";
import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
} from "@/server/modules/appointment/appointment.errors";
import {
  getAppointment as getAppointmentFromService,
  listMyAppointments,
} from "@/server/modules/appointment/appointment.service";
import { listAppointmentTransactions } from "@/server/modules/payment/payment.service";

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

/**
 * Loads the payment transactions for an appointment the caller may view.
 *
 * Used by the appointment detail page's "Payments" ledger. Returns the empty
 * shape on auth/missing/access-denied so a broken ledger never breaks the
 * rest of the page — the surrounding `getAppointment` call already gates the
 * main content via `notFound()`, so by the time we reach this helper the
 * appointment is known to exist; the catch is defense in depth for races
 * (e.g. the appointment is deleted between the two calls).
 *
 * Why we serialize `createdAt` to ISO strings here:
 * The service returns `Date` objects (server types). The client
 * `PaymentTransaction` shape uses `string` for `createdAt` because the same
 * type is used for the JSON HTTP response from `listTransactionsApi`. Mapping
 * here keeps one consistent wire shape on both paths.
 */
export async function listAppointmentTransactionsServer(
  appointmentId: string,
): Promise<{
  items: PaymentTransaction[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const user = await getSession();
  if (!user) {
    return { items: [], nextCursor: null, hasMore: false };
  }

  try {
    const result = await listAppointmentTransactions(user.id, appointmentId, {
      limit: 100,
    });
    return {
      items: result.items.map((txn) => ({
        ...txn,
        createdAt: txn.createdAt.toISOString(),
      })),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  } catch (error) {
    if (error instanceof AppointmentNotFoundError) {
      return { items: [], nextCursor: null, hasMore: false };
    }
    if (error instanceof AppointmentAccessDeniedError) {
      return { items: [], nextCursor: null, hasMore: false };
    }
    throw error;
  }
}
