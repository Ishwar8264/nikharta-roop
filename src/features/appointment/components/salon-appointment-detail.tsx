"use client";

import { MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";
import { PaymentLedger } from "@/features/payment";
import type { PaymentTransaction } from "@/features/payment";

import { updateAppointmentStatusApi } from "../api";
import { AppointmentStatusBadge } from "../appointment-ui";
import { appointmentPriceFormatter } from "../format";
import type { AppointmentStatus, PublicAppointment } from "../types";

/**
 * Browser-side copy of the server's status-transition state machine.
 *
 * Why a copy instead of importing from `appointment.service.ts`:
 * That module is marked `"server-only"` (it imports Prisma, auth helpers,
 * mailers). Importing it into a Client Component would either fail the build
 * by pulling server-only code into the browser bundle, or silently break if
 * Next.js managed to tree-shake it. Copying the ~12-line map keeps the client
 * self-contained; the JSDoc here points the maintainer at the source so a
 * drift is caught at review time.
 *
 * Source of truth:
 *   `TERMINAL_STATUSES` and `ALLOWED_TRANSITIONS`
 *   in `src/server/modules/appointment/appointment.service.ts`.
 *
 * If you change one, change the other in the same PR. The server still
 * rejects illegal transitions regardless of what the client renders, so a
 * drift here is a UI bug, not a security hole.
 */
const TERMINAL_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "RESCHEDULED",
]);

const ALLOWED_TRANSITIONS: Record<
  AppointmentStatus,
  ReadonlySet<AppointmentStatus>
> = {
  SCHEDULED: new Set<AppointmentStatus>(["CONFIRMED", "CANCELLED"]),
  CONFIRMED: new Set<AppointmentStatus>([
    "IN_PROGRESS",
    "CANCELLED",
    "NO_SHOW",
  ]),
  IN_PROGRESS: new Set<AppointmentStatus>(["COMPLETED", "CANCELLED"]),
  COMPLETED: new Set<AppointmentStatus>(),
  CANCELLED: new Set<AppointmentStatus>(),
  NO_SHOW: new Set<AppointmentStatus>(),
  RESCHEDULED: new Set<AppointmentStatus>(),
};

/** Toast copy for a successful transition — keeps the verb consistent. */
const SUCCESS_TOAST: Partial<Record<AppointmentStatus, string>> = {
  CONFIRMED: "Appointment confirmed. The customer has been notified.",
  IN_PROGRESS: "Appointment marked as in progress.",
  COMPLETED: "Appointment completed.",
  CANCELLED: "Appointment cancelled.",
  NO_SHOW: "Appointment marked as no-show.",
};

/**
 * The statuses the salon-side manage UI can drive an appointment *to*.
 *
 * Why a narrower union than `AppointmentStatus`:
 * `SCHEDULED` (the initial state a customer creates) and `RESCHEDULED` (set
 * by the reschedule flow on the customer side) are never valid *target*
 * states from a salon-side transition button. Mirror the
 * `updateAppointmentStatusSchema` enum in
 * `src/server/modules/appointment/appointment.schema.ts` so the client and
 * the server agree on the action surface.
 */
type ManageableTargetStatus =
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

/** Button copy for each target status. Mirrors the salon-side vocabulary. */
const TRANSITION_LABELS: Partial<Record<ManageableTargetStatus, string>> = {
  CONFIRMED: "Confirm",
  IN_PROGRESS: "Start",
  COMPLETED: "Complete",
  CANCELLED: "Cancel",
  NO_SHOW: "Mark no-show",
};

/** Render order — primary action first, destructive actions last. */
const TRANSITION_ORDER: ManageableTargetStatus[] = [
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
];

interface SalonAppointmentDetailProps {
  appointment: PublicAppointment;
  salonSlug: string;
  /**
   * The caller's role at this salon. The page already gates on MANAGER+ via
   * `getSalonForServiceManagement`, so this is always OWNER or MANAGER in
   * practice. The prop is kept (not derived from the appointment) because the
   * role lives on the *salon membership*, not on the appointment row — and a
   * future STAFF-access variant of this page would render the same component
   * with `viewerRole="STAFF"` (the transition buttons already rely on the
   * server-side `assertCanTransitionStatus`, so they degrade safely if a
   * staff viewer cannot perform an action).
   */
  viewerRole: "OWNER" | "MANAGER" | "STAFF";
  /**
   * Server-loaded payment transactions for the embedded `PaymentLedger`.
   *
   * Why passed in instead of fetched client-side:
   * The page already runs `listAppointmentTransactionsServer` to render the
   * ledger server-side — passing the rows as a prop avoids a flash of "no
   * payments yet" on first paint and mirrors the customer-facing detail
   * page. The `RecordPaymentDialog` still records new transactions through
   * the client API; on success it closes the dialog and `router.refresh()`
   * (triggered by the next status transition or by the parent route's
   * router-refresh policy) re-pulls fresh rows.
   */
  transactions: PaymentTransaction[];
}

/**
 * Salon-side appointment detail — the cockpit a salon owner / manager uses to
 * drive one booking through its lifecycle.
 *
 * Renders five cards stacked vertically:
 *   1. Status + transition buttons (gated by `ALLOWED_TRANSITIONS`)
 *   2. Customer card (avatar, name, phone, link to notes timeline)
 *   3. Services card (per-line price + totals)
 *   4. Payments card — the shared `PaymentLedger` with `RecordPaymentDialog`
 *   5. Notes card (only when `appointment.notes` is non-empty)
 *
 * Why a Client Component:
 * Status transitions need `useState` (pending-cancel reason, busy flag) and
 * `useRouter` (refresh after a successful PATCH). The PaymentLedger is itself
 * a Client Component; embedding it in a server tree would force it to be a
 * sibling, splitting this single "manage appointment" surface across files.
 */
export function SalonAppointmentDetail({
  appointment,
  salonSlug,
  viewerRole,
  transactions,
}: SalonAppointmentDetailProps) {
  // `viewerRole` is read here only for the JSDoc — the page already gated on
  // MANAGER+, so every reachable viewer may perform every transition this
  // component shows. The prop is reserved for the future STAFF variant.
  void viewerRole;

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingCancel, setPendingCancel] = useState(false);
  const [reason, setReason] = useState("");

  const isTerminal = TERMINAL_STATUSES.has(appointment.status);
  const allowed = ALLOWED_TRANSITIONS[appointment.status] ?? new Set();
  // Render in the curated order (primary → destructive) so the cancel button
  // is always last — a salon owner's thumb sweeps left-to-right on the
  // happy path (Confirm → Start → Complete) without passing the destructive
  // action first.
  const orderedTargets = TRANSITION_ORDER.filter((status) =>
    allowed.has(status),
  );

  async function submitTransition(
    target: ManageableTargetStatus,
    cancelReason?: string,
  ) {
    try {
      await updateAppointmentStatusApi(appointment.id, {
        status: target,
        ...(cancelReason && cancelReason.trim()
          ? { reason: cancelReason.trim() }
          : {}),
      });
      toast.success(SUCCESS_TOAST[target] ?? "Status updated.");
      setPendingCancel(false);
      setReason("");
      // Pull the fresh appointment + transactions from the server so the new
      // status badge and any side-effects (coupon release, loyalty award)
      // are reflected without a full page navigation.
      startTransition(() => router.refresh());
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Couldn't update the appointment status. Please try again.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Status + transitions */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Status</span>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          {!isTerminal ? (
            <div className="flex flex-wrap items-center gap-2">
              {orderedTargets.map((target) => (
                <Button
                  key={target}
                  type="button"
                  variant={target === "CANCELLED" ? "outline" : "default"}
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    // Cancel is the only transition that needs an inline
                    // reason prompt. Every other transition fires
                    // immediately — the salon owner's intent is unambiguous
                    // ("Confirm", "Start", "Complete").
                    if (target === "CANCELLED") {
                      setPendingCancel(true);
                    } else {
                      void submitTransition(target);
                    }
                  }}
                >
                  {TRANSITION_LABELS[target]}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              This appointment is in a final state.
            </p>
          )}
        </div>

        {pendingCancel ? (
          <div className="mt-4 space-y-2">
            <Label htmlFor="cancel-reason">
              Cancel reason{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Customer rescheduled for a different time."
              maxLength={500}
              rows={3}
              disabled={isPending}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() =>
                  void submitTransition("CANCELLED", reason)
                }
              >
                {isPending ? "Cancelling…" : "Confirm cancel"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  setPendingCancel(false);
                  setReason("");
                }}
              >
                Back
              </Button>
            </div>
          </div>
        ) : null}

        {appointment.cancelReason ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Cancel reason:{" "}
            <span className="text-foreground">
              {appointment.cancelReason}
            </span>
          </p>
        ) : null}
      </section>

      {/* 2. Customer */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Customer</h2>
        <div className="mt-3 flex items-start gap-3">
          <Avatar>
            {appointment.customer.avatar ? (
              <AvatarImage
                src={appointment.customer.avatar}
                alt={appointment.customer.name ?? "Customer"}
              />
            ) : null}
            <AvatarFallback>
              {(
                appointment.customer.name?.trim()[0] ?? "?"
              ).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <p className="font-medium leading-tight">
              {appointment.customer.name ?? "Customer"}
            </p>
            {appointment.customer.phone ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {appointment.customer.phone}
              </p>
            ) : null}
            <Link
              href={routes.salonCustomerNotes(
                salonSlug,
                appointment.customer.id,
              )}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
              View customer notes
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Services + totals */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Services</h2>
        <ul className="mt-4 divide-y divide-border">
          {appointment.services.map((line) => (
            <li
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
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{appointmentPriceFormatter.format(appointment.subtotal)}</dd>
          </div>
          {appointment.discount > 0 ? (
            <div className="flex justify-between text-emerald-600">
              <dt>Discount</dt>
              <dd>
                −{appointmentPriceFormatter.format(appointment.discount)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tax</dt>
            <dd>{appointmentPriceFormatter.format(appointment.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd>{appointmentPriceFormatter.format(appointment.totalPrice)}</dd>
          </div>
        </dl>
      </section>

      {/* 4. Payments — reuse the shared ledger + record-payment dialog. */}
      <PaymentLedger
        appointmentId={appointment.id}
        totalPrice={appointment.totalPrice}
        transactions={transactions}
        canRecord={appointment.viewerCanRecordPayment ?? false}
      />

      {/* 5. Notes */}
      {appointment.notes ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {appointment.notes}
          </p>
        </section>
      ) : null}
    </div>
  );
}
