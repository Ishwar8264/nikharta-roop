"use client";

import { CalendarDays, Check, Clock, Scissors, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BackButton } from "@/components/shared/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { useAuth } from "@/features/auth/components/authProvider";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { createAppointment, getAvailability, getServiceStaff } from "./api";
import {
  appointmentPriceFormatter,
  formatAppointmentDateTime,
} from "./format";
import type { AvailabilitySlot, BookingService, BookingStaff } from "./types";

interface BookingFlowProps {
  salon: { id: string; name: string; slug: string; timezone: string };
  services: BookingService[];
  initialServiceSlug?: string;
}

const DRAFT_KEY_PREFIX = "booking-draft:";

/** Implements the complete Service → Staff → Date → Slot → Review flow. */
export function BookingFlow({
  salon,
  services,
  initialServiceSlug,
}: BookingFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const initialService = services.find((item) => item.slug === initialServiceSlug);
  const [serviceIds, setServiceIds] = useState<string[]>(
    initialService ? [initialService.id] : [],
  );
  const [staff, setStaff] = useState<BookingStaff[]>([]);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedServices = useMemo(
    () => services.filter((item) => serviceIds.includes(item.id)),
    [serviceIds, services],
  );
  const selectedStaff = staff.find((item) => item.userId === staffId);
  const selectedSlot = slots.find((item) => item.startTime === startTime);
  const subtotal = selectedServices.reduce((sum, item) => sum + item.price, 0);
  const duration = selectedServices.reduce((sum, item) => sum + item.duration, 0);

  useEffect(() => {
    const stored = sessionStorage.getItem(`${DRAFT_KEY_PREFIX}${salon.slug}`);
    if (!stored) return;
    try {
      const draft = JSON.parse(stored) as BookingDraft;
      queueMicrotask(() => {
        if (
          draft.serviceIds?.every((id) =>
            services.some((service) => service.id === id),
          )
        ) {
          setServiceIds(draft.serviceIds);
        }
        setStaffId(draft.staffId ?? "");
        setDate(draft.date ?? "");
        setStartTime(draft.startTime ?? "");
        setNotes(draft.notes ?? "");
        setCouponCode(draft.couponCode ?? "");
      });
    } catch {
      sessionStorage.removeItem(`${DRAFT_KEY_PREFIX}${salon.slug}`);
    }
  }, [salon.slug, services]);

  useEffect(() => {
    if (selectedServices.length === 0) {
      return;
    }
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoadingStaff(true);
      setError(null);
    });
    Promise.all(
      selectedServices.map((service) =>
        getServiceStaff(salon.slug, service.slug),
      ),
    )
      .then((lists) => {
        if (!active) return;
        const [first = []] = lists;
        const common = first.filter((candidate) =>
          lists.every((list) =>
            list.some((item) => item.userId === candidate.userId),
          ),
        );
        setStaff(common);
        setStaffId((current) =>
          common.some((item) => item.userId === current) ? current : "",
        );
      })
      .catch((reason: unknown) => {
        if (active) setError(apiMessage(reason));
      })
      .finally(() => active && setLoadingStaff(false));
    return () => {
      active = false;
    };
  }, [salon.slug, selectedServices]);

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
    getAvailability({ salonSlug: salon.slug, staffId, serviceIds, date })
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
  }, [date, salon.slug, serviceIds, staffId]);

  const earliestDate = useMemo(
    () => salonToday(salon.timezone),
    [salon.timezone],
  );
  const ready = Boolean(selectedSlot && selectedStaff && selectedServices.length);

  function toggleService(id: string): void {
    setServiceIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
    setStaffId("");
    setStaff([]);
    setLoadingStaff(false);
    setDate("");
    setStartTime("");
    setSlots([]);
    setLoadingSlots(false);
  }

  async function confirmBooking(): Promise<void> {
    if (!ready || !selectedSlot) return;
    const draft = { serviceIds, staffId, date, startTime, notes, couponCode };
    if (!user) {
      sessionStorage.setItem(
        `${DRAFT_KEY_PREFIX}${salon.slug}`,
        JSON.stringify(draft),
      );
      const redirect = `${routes.salonBooking(salon.slug)}?resume=1`;
      router.push(`${routes.login}?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const appointment = await createAppointment({
        salonRef: salon.slug,
        staffId,
        startTime: selectedSlot.startTime,
        services: serviceIds.map((serviceId) => ({ serviceId, staffId })),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
      });
      sessionStorage.removeItem(`${DRAFT_KEY_PREFIX}${salon.slug}`);
      router.push(routes.appointmentDetail(appointment.id));
    } catch (reason) {
      setError(apiMessage(reason));
      if (reason instanceof ApiError && reason.status === 409) {
        setStartTime("");
        setSlots([]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <BackButton href={routes.salonDetail(salon.slug)} variant="secondary" />
      <header className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {salon.name}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">
          Book appointment
        </h1>
        <p className="mt-2 text-muted-foreground">
          Service → Staff → Date → Slot → Review → Confirm
        </p>
      </header>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        <BookingStep number={1} title="Choose services" icon={Scissors}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                aria-pressed={serviceIds.includes(service.id)}
                onClick={() => toggleService(service.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  serviceIds.includes(service.id)
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <span className="flex justify-between gap-3 font-medium">
                  {service.name}
                  {serviceIds.includes(service.id) ? (
                    <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  ) : null}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">
                  {appointmentPriceFormatter.format(service.price)} · {service.duration} min
                </span>
              </button>
            ))}
          </div>
        </BookingStep>

        <BookingStep number={2} title="Choose staff" icon={UserRound} disabled={!serviceIds.length}>
          {loadingStaff ? (
            <p className="text-sm text-muted-foreground">Loading eligible staff…</p>
          ) : staff.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {staff.map((member) => (
                <button key={member.userId} type="button" aria-pressed={staffId === member.userId} onClick={() => { setStaffId(member.userId); setDate(""); setStartTime(""); }} className={cn("rounded-xl border p-4 text-left", staffId === member.userId ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border")}>
                  {member.user.name ?? "Salon professional"}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{serviceIds.length ? "No common staff is available for the selected services." : "Select services first."}</p>
          )}
        </BookingStep>

        <BookingStep number={3} title="Choose date" icon={CalendarDays} disabled={!staffId}>
          <div className="max-w-xs"><Label htmlFor="booking-date">Appointment date</Label><Input id="booking-date" className="mt-2" type="date" min={earliestDate} value={date} onChange={(event) => { setDate(event.target.value); setStartTime(""); }} /></div>
        </BookingStep>

        <BookingStep number={4} title="Choose slot" icon={Clock} disabled={!date}>
          {loadingSlots ? <p className="text-sm text-muted-foreground">Checking availability…</p> : slots.length ? <div className="flex flex-wrap gap-2">{slots.map((slot) => <button key={slot.startTime} type="button" aria-pressed={startTime === slot.startTime} onClick={() => setStartTime(slot.startTime)} className={cn("rounded-md border px-3 py-2 text-sm", startTime === slot.startTime ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{formatSlot(slot.startTime, salon.timezone)}</button>)}</div> : <p className="text-sm text-muted-foreground">{date ? "No slots available for this date." : "Choose a date first."}</p>}
        </BookingStep>

        <BookingStep number={5} title="Review" icon={Check} disabled={!selectedSlot}>
          {selectedSlot && selectedStaff ? <div className="space-y-4"><div className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Staff:</span> {selectedStaff.user.name ?? "Salon professional"}</p><p><span className="text-muted-foreground">When:</span> {formatAppointmentDateTime(selectedSlot.startTime, salon.timezone)}</p><p><span className="text-muted-foreground">Duration:</span> {duration} min</p><p><span className="text-muted-foreground">Subtotal:</span> {appointmentPriceFormatter.format(subtotal)}</p></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="coupon">Coupon code</Label><Input id="coupon" className="mt-2" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} /></div><div><Label htmlFor="notes">Notes</Label><Textarea id="notes" className="mt-2" maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} /></div></div></div> : <p className="text-sm text-muted-foreground">Complete the previous steps to review.</p>}
        </BookingStep>

        <Button className="w-full sm:w-auto" disabled={!ready || submitting} onClick={() => void confirmBooking()}>{submitting ? "Confirming…" : user ? "Confirm appointment" : "Sign in and confirm"}</Button>
      </div>
    </main>
  );
}

interface BookingDraft {
  serviceIds?: string[];
  staffId?: string;
  date?: string;
  startTime?: string;
  notes?: string;
  couponCode?: string;
}

function BookingStep({ number, title, icon: Icon, disabled, children }: { number: number; title: string; icon: typeof Scissors; disabled?: boolean; children: React.ReactNode }) {
  return <section data-disabled={disabled || undefined} className={cn("rounded-xl border border-border bg-card p-5", disabled && "opacity-60")}><h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{number}</span><Icon className="h-4 w-4" aria-hidden="true" />{title}</h2><div className={cn("mt-4", disabled && "pointer-events-none")}>{children}</div></section>;
}

function apiMessage(reason: unknown): string {
  return reason instanceof ApiError ? reason.message : "Network error";
}

function salonToday(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function formatSlot(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-IN", { timeStyle: "short", timeZone: timezone }).format(new Date(value));
}
