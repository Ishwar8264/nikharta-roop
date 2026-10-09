"use client";

import { CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { getAvailability, rescheduleAppointmentApi } from "../api";
import type { AvailabilitySlot } from "../types";

/**
 * Props for the controlled reschedule dialog.
 *
 * `staffId` is required even though the reschedule *body* allows it to be
 * omitted: the availability endpoint (`availabilityQuerySchema`) demands a
 * `staffId` to compute bookable slots. When the appointment has no assigned
 * staff, the parent should pass `null` and the dialog renders a static
 * "contact the salon" notice instead of slot UI.
 *
 * `currentStartTime` seeds the date picker with the appointment's existing
 * salon-local date so the customer immediately sees alternatives for the same
 * day — they can change it freely afterwards.
 */
export interface RescheduleDialogProps {
  appointmentId: string;
  salonSlug: string;
  salonTimezone: string;
  staffId: string | null;
  serviceIds: string[];
  currentStartTime: string | Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Customer-facing reschedule dialog.
 *
 * Reuses the booking-flow slot pattern verbatim (date `<input type="date">` →
 * `getAvailability` → slot buttons → confirm). The only divergence is the
 * confirm action: instead of `createAppointment` it calls
 * `rescheduleAppointmentApi`, then `toast` + `router.refresh()` + close.
 *
 * Why no reason textarea:
 * `rescheduleAppointmentSchema` is a `strictObject` over `{ startTime,
 * staffId? }` and rejects unknown keys. Sending `reason` would 400 the
 * request, so the field is intentionally absent here.
 */
export function RescheduleDialog({
  appointmentId,
  salonSlug,
  salonTimezone,
  staffId,
  serviceIds,
  currentStartTime,
  open,
  onOpenChange,
}: RescheduleDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [startTime, setStartTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const earliestDate = useMemo(
    () => salonDateOf(new Date(), salonTimezone),
    [salonTimezone],
  );

  // Reset + seed state each time the dialog opens. Seeding the date with the
  // appointment's current salon-local day triggers the availability effect
  // below, so the customer lands on a populated slot grid instead of an empty
  // picker. The setStates are deferred to a microtask (matching the
  // booking-flow pattern) so the React Compiler doesn't flag a synchronous
  // cascade inside the effect.
  useEffect(() => {
    if (!open) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setDate(salonDateOf(currentStartTime, salonTimezone));
      setSlots([]);
      setStartTime("");
      setError(null);
      setLoadingSlots(false);
    });
    return () => {
      active = false;
    };
  }, [open, currentStartTime, salonTimezone]);

  // Fetch availability when date + staff + services are all known. Mirrors the
  // booking-flow effect so slot rendering stays consistent across surfaces.
  useEffect(() => {
    if (!staffId || !date || serviceIds.length === 0) {
      return;
    }
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoadingSlots(true);
      setError(null);
    });
    getAvailability({ salonSlug, staffId, serviceIds, date })
      .then((nextSlots) => {
        if (!active) return;
        setSlots(nextSlots);
        setStartTime((current) =>
          nextSlots.some((slot) => slot.startTime === current) ? current : "",
        );
      })
      .catch((reason: unknown) => {
        if (active) setError(apiMessage(reason));
      })
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [date, salonSlug, serviceIds, staffId]);

  const selectedSlot = slots.find((slot) => slot.startTime === startTime);
  const ready = Boolean(selectedSlot);
  const busy = submitting || isPending;

  async function confirmReschedule(): Promise<void> {
    if (!ready || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      await rescheduleAppointmentApi(appointmentId, {
        startTime: selectedSlot.startTime,
      });
      toast.success("Appointment rescheduled.");
      onOpenChange(false);
      // Pull the fresh appointment (new id, RESCHEDULED status on the old
      // row) from the server without a full navigation.
      startTransition(() => router.refresh());
    } catch (reason) {
      const message = apiMessage(reason);
      toast.error(message);
      // On a slot-taken / outside-hours conflict, drop the selection so the
      // customer picks a fresh slot instead of re-submitting the same
      // unavailable time.
      if (reason instanceof ApiError && reason.status === 409) {
        setStartTime("");
        setSlots([]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Reschedule appointment
          </DialogTitle>
          <DialogDescription>
            Pick a new date and time. The salon&apos;s live availability
            updates as you change the date.
          </DialogDescription>
        </DialogHeader>

        {!staffId ? (
          <p className="text-sm text-muted-foreground">
            This appointment doesn&apos;t have an assigned professional, so
            online rescheduling isn&apos;t available. Please contact the salon
            directly to move it.
          </p>
        ) : (
          <div className="space-y-4">
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

            <div className="max-w-xs">
              <Label htmlFor="reschedule-date">New date</Label>
              <Input
                id="reschedule-date"
                className="mt-2"
                type="date"
                min={earliestDate}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setStartTime("");
                }}
                disabled={busy}
              />
            </div>

            <div>
              <p className="text-sm font-medium">Available slots</p>
              {loadingSlots ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Checking availability…
                </p>
              ) : slots.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      aria-pressed={startTime === slot.startTime}
                      onClick={() => setStartTime(slot.startTime)}
                      disabled={busy}
                      className={cn(
                        "rounded-md border px-3 py-2 text-sm",
                        startTime === slot.startTime
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {formatSlot(slot.startTime, salonTimezone)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {date
                    ? "No slots available for this date."
                    : "Choose a date first."}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!ready || busy || !staffId}
            onClick={() => void confirmReschedule()}
          >
            {submitting ? "Rescheduling…" : "Confirm reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RescheduleButtonProps
  extends Omit<RescheduleDialogProps, "open" | "onOpenChange"> {
  /**
   * Optional override for the trigger button label. Defaults to
   * &quot;Reschedule&quot;.
   */
  label?: string;
}

/**
 * Self-contained trigger button + dialog wrapper.
 *
 * Why a separate wrapper:
 * The appointment detail page is a Server Component, so it cannot hold the
 * dialog's open state. This client component owns the `open` state and renders
 * the trigger button plus the controlled `RescheduleDialog`, giving the page a
 * single drop-in element.
 */
export function RescheduleButton({
  label = "Reschedule",
  ...dialogProps
}: RescheduleButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <CalendarClock className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
      <RescheduleDialog open={open} onOpenChange={setOpen} {...dialogProps} />
    </>
  );
}

function apiMessage(reason: unknown): string {
  return reason instanceof ApiError ? reason.message : "Network error";
}

/** Formats an instant as the salon-local YYYY-MM-DD the date input expects. */
function salonDateOf(value: string | Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

/** Formats a slot instant as a short salon-local time label. */
function formatSlot(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value));
}
