import { notFound } from "next/navigation";

import { BackButton } from "@/components/shared/back-button";
import { routes } from "@/config/routes";
import {
  getAppointment,
  listAppointmentTransactionsServer,
} from "@/features/appointment/api.server";
import { AppointmentStatusBadge } from "@/features/appointment/appointment-ui";
import {
  appointmentPriceFormatter,
  formatAppointmentDateTime,
} from "@/features/appointment/format";
import { PaymentLedger } from "@/features/payment";
import { StaffRatingCard } from "@/features/review";
import { listStaffRatingsForAppointmentServer } from "@/features/review/api.server";
import type { RateableStaffMember } from "@/features/review";
import { getSession } from "@/lib/auth/get-session";
import { isResourceId } from "@/server/modules/salon/salon.helpers";

/**
 * Collects the staff members the customer can rate for this appointment.
 *
 * Why only the primary staff:
 * The create endpoint binds a rating to `Appointment.staffId` (the primary
 * staff) and rejects everything else via `ReviewNoStaffToRateError`. Showing
 * a form for per-service staff that the API will not accept would be broken
 * UX, so the card receives just the rateable member. The name/avatar are
 * looked up from the service lines so the avatar matches what the customer
 * saw during booking; if the primary staff is not on any line we fall back to
 * a nameless entry so the card still renders.
 */
function collectRateableStaff(appointment: {
  staffId: string | null;
  services: Array<{
    staff: { id: string; name: string | null; avatar: string | null } | null;
  }>;
}): RateableStaffMember[] {
  if (!appointment.staffId) return [];
  const fromLine = appointment.services
    .map((line) => line.staff)
    .find((staff) => staff?.id === appointment.staffId);
  return [
    fromLine ?? {
      id: appointment.staffId,
      name: null,
      avatar: null,
    },
  ];
}

/** Shows one authorized appointment with services, totals, and payments. */
export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isResourceId(id)) notFound();
  const appointment = await getAppointment(id);
  if (!appointment) notFound();

  // Load the payment ledger in parallel-friendly order. `canRecord` is
  // server-resolved — true only when the viewer is a salon MANAGER+ for the
  // appointment's salon — so customers never see the "Record payment"
  // button, but salon managers/owners viewing the same appointment do.
  const transactions = await listAppointmentTransactionsServer(id);
  const canRecord = appointment.viewerCanRecordPayment ?? false;

  // Staff ratings are only available to the appointment's customer on a
  // COMPLETED visit. Salon staff viewing the same appointment never see the
  // rating form (the API rejects non-customers), so we gate the card here
  // rather than relying on a 403 after submit. `getSession()` is cached per
  // request, so this dedupes with the call inside `getAppointment`.
  const session = await getSession();
  const isCustomer =
    session !== null && session.id === appointment.customerId;
  const showRatingCard = appointment.status === "COMPLETED" && isCustomer;
  const existingRatings = showRatingCard
    ? await listStaffRatingsForAppointmentServer(appointment.id)
    : [];
  const rateableStaff = showRatingCard ? collectRateableStaff(appointment) : [];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <BackButton href={routes.appointments} variant="secondary" />

      <div className="mt-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Appointment</p>
          <h1 className="font-heading text-3xl font-semibold">
            {appointment.salon.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {formatAppointmentDateTime(
              appointment.startTime,
              appointment.salon.timezone,
            )}
          </p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Services</h2>
        <div className="mt-4 divide-y divide-border">
          {appointment.services.map((line) => (
            <div
              key={line.serviceId}
              className="flex justify-between gap-4 py-3"
            >
              <div>
                <p className="font-medium">{line.service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {line.service.duration} min ·{" "}
                  {line.staff?.name ?? "Salon professional"}
                </p>
              </div>
              <p className="font-medium">
                {appointmentPriceFormatter.format(line.price)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Price summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{appointmentPriceFormatter.format(appointment.subtotal)}</dd>
          </div>
          {appointment.discount > 0 ? (
            <div className="flex justify-between text-emerald-600">
              <dt>Discount</dt>
              <dd>−{appointmentPriceFormatter.format(appointment.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd>{appointmentPriceFormatter.format(appointment.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd>{appointmentPriceFormatter.format(appointment.totalPrice)}</dd>
          </div>
        </dl>
      </section>

      <PaymentLedger
        appointmentId={appointment.id}
        totalPrice={appointment.totalPrice}
        transactions={transactions.items}
        canRecord={canRecord}
      />

      {showRatingCard ? (
        <StaffRatingCard
          appointmentId={appointment.id}
          staffMembers={rateableStaff}
          existingRatings={existingRatings}
        />
      ) : null}

      {appointment.notes ? (
        <section className="mt-4 rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {appointment.notes}
          </p>
        </section>
      ) : null}
    </main>
  );
}
