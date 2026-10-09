import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { routes } from "@/config/routes";
import { SalonAppointmentDetail } from "@/features/appointment/components/salon-appointment-detail";
import { formatAppointmentDateTime } from "@/features/appointment/format";
import { listAppointmentTransactionsServer } from "@/features/appointment/api.server";
import type { PaymentTransaction } from "@/features/payment";
import { getSession } from "@/lib/auth/get-session";
import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
} from "@/server/modules/appointment/appointment.errors";
import { getAppointment } from "@/server/modules/appointment/appointment.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { isResourceId } from "@/server/modules/salon/salon.helpers";

export const metadata: Metadata = {
  title: "Manage appointment | Nikharta Roop",
  description:
    "Salon-side appointment detail — confirm, start, complete, cancel, or mark no-show, and record payments inline.",
  robots: { index: false },
};

interface PageProps {
  params: Promise<{ slug: string; appointmentId: string }>;
}

/**
 * Salon-side appointment detail page.
 *
 * Why call the service directly (not `features/appointment/api.server.ts`):
 * The api.server `getAppointment` wrapper returns `null` for both "missing"
 * and "access denied", which is the right shape for the customer-facing
 * page (a missing appointment and a foreign one are both "yours? no"). The
 * salon-side page needs the same null-collapsed behaviour PLUS a downstream
 * `appointment.salonId === salon.id` check, so calling the service directly
 * keeps the error handling uniform and avoids a double `getSession()` call
 * (the page already resolved the user for `getSalonForServiceManagement`).
 *
 * Why the salon ownership check:
 * `getAppointment(callerId, id)` authorizes the *caller* (a MANAGER+ at any
 * salon they belong to, the assigned staff, or the booking customer). A
 * manager of salon A who is *also* a manager of salon B can view salon B's
 * appointments through their own viewer context — that's correct in the
 * abstract, but the salon-side URL is namespaced by salon slug. Hitting
 * `/salons/salon-A/manage/appointments/{salon-B-appointment-id}` must 404
 * even if the caller could legitimately view that appointment through
 * salon B's URL. The `salonId` comparison enforces that scoping.
 */
export default async function ManageSalonAppointmentDetailPage({
  params,
}: PageProps) {
  const { slug, appointmentId } = await params;

  // Cheap ID-shape check — a non-cuid appointmentId can't exist, so we 404
  // before hitting the DB. Mirrors the customer-facing detail page's guard.
  if (!isResourceId(appointmentId)) notFound();

  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        routes.salonAppointmentManageDetail(slug, appointmentId),
      )}`,
    );
  }

  // Salon guard — MANAGER+. Throws typed errors the catch maps to notFound();
  // anything else rethrows so the route-level error boundary reports a real
  // failure instead of a 404.
  let salon: Awaited<ReturnType<typeof getSalonForServiceManagement>>;
  try {
    salon = await getSalonForServiceManagement(slug, user.id);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  // Appointment load + access check (caller-level — the caller can view this
  // appointment iff they're the customer, the assigned staff, or a MANAGER+
  // of the appointment's salon). The salon-ownership check below tightens
  // this to "AND the appointment belongs to *this* salon's slug".
  let appointment: Awaited<ReturnType<typeof getAppointment>>;
  try {
    appointment = await getAppointment(user.id, appointmentId);
  } catch (error) {
    if (
      error instanceof AppointmentNotFoundError ||
      error instanceof AppointmentAccessDeniedError
    ) {
      notFound();
    }
    throw error;
  }

  // Salon-ownership check — see the JSDoc on this page for the threat model.
  // A MANAGER+ of salon A who is *also* a MANAGER+ of salon B can otherwise
  // reach salon B's appointment through salon A's URL; we 404 to keep the
  // URL namespace honest.
  if (appointment.salonId !== salon.id) notFound();

  // Load the payment ledger in parallel-friendly order — by this point both
  // the salon and the appointment are known to exist and the caller is
  // authorized, so the ledger fetch cannot 403. The defensive `?? []`
  // below only kicks in on a race (appointment deleted between the two
  // calls), in which case the surrounding `notFound()` above has already
  // fired on a later request.
  const transactionsResult = await listAppointmentTransactionsServer(
    appointmentId,
  );
  const transactions: PaymentTransaction[] = transactionsResult?.items ?? [];

  const customerName = appointment.customer.name ?? "Customer";
  const customerInitial = (
    appointment.customer.name?.trim()[0] ?? "?"
  ).toUpperCase();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">

      <header className="mt-6 flex flex-wrap items-start gap-4">
        <Avatar size="lg">
          {appointment.customer.avatar ? (
            <AvatarImage
              src={appointment.customer.avatar}
              alt={customerName}
            />
          ) : null}
          <AvatarFallback>{customerInitial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Appointment</p>
          <h1 className="font-heading text-3xl font-semibold">
            {customerName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {formatAppointmentDateTime(
              appointment.startTime,
              appointment.salon.timezone,
            )}
          </p>
        </div>
      </header>

      <div className="mt-8">
        <SalonAppointmentDetail
          appointment={appointment}
          salonSlug={slug}
          viewerRole={salon.viewerRole}
          transactions={transactions}
        />
      </div>
    </main>
  );
}
