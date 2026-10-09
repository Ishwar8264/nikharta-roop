"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Banknote,
  CheckCircle2,
  Clock,
  DoorOpen,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { updateSettingsApi } from "./api";
import type { SalonSettings, UpdateSettingsBody } from "./api";
import { settingsFormSchema, type SettingsFormValues } from "./schemas";
import type { SettingsFormProps } from "./types";

/** Tracks a form-level API error message. */
function useApiError() {
  const [message, setMessage] = useState<string | null>(null);
  function show(caught: unknown) {
    if (caught instanceof ApiError) {
      setMessage(caught.message);
      return;
    }
    setMessage("Something went wrong. Please try again.");
  }
  return { message, setMessage, show };
}

/**
 * Builds a PATCH body containing only the fields whose value differs from the
 * persisted snapshot. The server rejects empty bodies, so callers should also
 * guard with `isDirty` — but the diff itself is the source of truth and keeps
 * the wire payload small.
 */
function buildDiffBody(
  next: SettingsFormValues,
  initial: SalonSettings,
): UpdateSettingsBody {
  const body: UpdateSettingsBody = {};
  if (next.bufferMinutes !== initial.bufferMinutes) {
    body.bufferMinutes = next.bufferMinutes;
  }
  if (next.advanceBookingDays !== initial.advanceBookingDays) {
    body.advanceBookingDays = next.advanceBookingDays;
  }
  if (next.cancellationWindowHours !== initial.cancellationWindowHours) {
    body.cancellationWindowHours = next.cancellationWindowHours;
  }
  if (next.noShowFee !== initial.noShowFee) {
    body.noShowFee = next.noShowFee;
  }
  if (next.acceptsAdvancePayments !== initial.acceptsAdvancePayments) {
    body.acceptsAdvancePayments = next.acceptsAdvancePayments;
  }
  if (next.walkInsAllowed !== initial.walkInsAllowed) {
    body.walkInsAllowed = next.walkInsAllowed;
  }
  return body;
}

/** Parses a number input value: empty string → null, otherwise the number. */
function parseNumberOrEmpty(
  event: React.ChangeEvent<HTMLInputElement>,
): number | null {
  const raw = event.target.value;
  if (raw === "") return null;
  const parsed = event.target.valueAsNumber;
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Section header for one settings group.
 *
 * Why a local helper (not a shared atom): the three sections share the same
 * visual contract — a tinted icon circle + a numbered eyebrow + an uppercase
 * title + a one-line description — but each carries its own icon and copy.
 * A shared atom would need icon + title + description + step props and lose
 * the per-section context this single form depends on. Keeping it inline
 * also makes the icon imports trivially traceable from this file.
 */
function SectionHeader({
  icon: Icon,
  step,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tabular-nums text-muted-foreground/70">
            {String(step).padStart(2, "0")}
          </span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            {title}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/** Single-card settings form for salon booking rules. */
export function SettingsForm({ salonSlug, initial, canEdit }: SettingsFormProps) {
  const apiError = useApiError();
  const [busy, setBusy] = useState(false);

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: initial,
    mode: "onTouched",
    reValidateMode: "onChange",
    disabled: !canEdit,
  });

  async function submit(values: SettingsFormValues) {
    apiError.setMessage(null);
    const body = buildDiffBody(values, initial);
    if (Object.keys(body).length === 0) {
      toast.info("No changes to save.");
      return;
    }
    setBusy(true);
    try {
      const response = await updateSettingsApi(salonSlug, body);
      toast.success("Settings saved.");
      // Reset dirty state with the freshly-persisted values so the Save
      // button disables again until the user makes another change.
      reset(response.data.settings);
    } catch (caught) {
      apiError.show(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <FormHeader
        title="Salon settings"
        description="Booking buffers, payment rules, and walk-in policy for your salon."
      />

      {apiError.message ? <FormError>{apiError.message}</FormError> : null}

      {!canEdit ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          You need manager access to change these.
        </p>
      ) : null}

      <Card>
        <CardContent className="space-y-6">
          {/* Booking */}
          <section id="booking" className="space-y-5 scroll-mt-24">
            <SectionHeader
              icon={Clock}
              step={1}
              title="Booking"
              description="Control how far in advance customers can book and the gaps between appointments."
            />

            <Controller
              name="bufferMinutes"
              control={control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="bufferMinutes">
                    Buffer between appointments (minutes)
                  </Label>
                  <div className="flex items-center gap-4">
                    {/* Slider + its scale labels are grouped in a flex-1 column
                        so the 0..30 scale aligns with the slider's own bounds,
                        not the wider slider+input row. */}
                    <div className="flex-1 space-y-1">
                      <Slider
                        value={field.value}
                        onValueChange={field.onChange}
                        min={0}
                        max={30}
                        step={5}
                        disabled={field.disabled || busy}
                        aria-label="Buffer minutes slider"
                        aria-describedby="bufferMinutes-description"
                        className={cn(
                          // Visual track enhancement — the shared Slider
                          // primitive ships a 1.5px-tall muted track; here we
                          // bump it to 2px and make the filled indicator more
                          // present on a settings page that is otherwise a
                          // wall of toggles + numeric inputs. Targeted via
                          // data-slot so the primitive's own classnames stay
                          // untouched.
                          "[&_[data-slot=slider-track]]:h-2",
                          "[&_[data-slot=slider-track]]:bg-muted",
                          "[&_[data-slot=slider-indicator]]:bg-primary",
                          "[&_[data-slot=slider-thumb]]:size-5",
                          "[&_[data-slot=slider-thumb]]:border-2",
                        )}
                      />
                      <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground/70">
                        <span>0</span>
                        <span>10</span>
                        <span>20</span>
                        <span>30</span>
                      </div>
                    </div>
                    <Input
                      id="bufferMinutes"
                      type="number"
                      min={0}
                      max={120}
                      step={5}
                      inputMode="numeric"
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(event) => {
                        const parsed = parseNumberOrEmpty(event);
                        field.onChange(parsed ?? 0);
                      }}
                      disabled={field.disabled || busy}
                      aria-invalid={fieldState.invalid || undefined}
                      aria-describedby="bufferMinutes-description"
                      className="w-20"
                    />
                  </div>
                  <p
                    id="bufferMinutes-description"
                    className="text-xs text-muted-foreground"
                  >
                    {field.value === 0
                      ? "Back-to-back appointments — staff get no recovery time between customers."
                      : field.value <= 10
                        ? "Quick turnover — staff get a short breather between customers."
                        : "Spacious rhythm — staff get ample time to reset the chair between customers."}
                  </p>
                  {fieldState.error?.message ? (
                    <p className="text-xs text-destructive">
                      {fieldState.error.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Field
              id="advanceBookingDays"
              label="Advance booking window (days)"
              type="number"
              min={1}
              max={365}
              step={1}
              inputMode="numeric"
              placeholder="e.g. 30"
              description="How many days into the future a customer can book. Lower keeps the calendar same-week focused; higher lets planners lock a slot months out."
              error={errors.advanceBookingDays?.message}
              {...register("advanceBookingDays", {
                setValueAs: (value) => {
                  if (value === "" || value === null) return Number.NaN;
                  return Number(value);
                },
              })}
            />

            <Field
              id="cancellationWindowHours"
              label="Cancellation window (hours)"
              type="number"
              min={0}
              max={168}
              step={1}
              inputMode="numeric"
              placeholder="e.g. 4"
              description="Customers can cancel free of charge up to this many hours before the slot. Inside the window, the no-show fee below may apply."
              error={errors.cancellationWindowHours?.message}
              {...register("cancellationWindowHours", {
                setValueAs: (value) => {
                  if (value === "" || value === null) return Number.NaN;
                  return Number(value);
                },
              })}
            />
          </section>

          {/* Subtle dashed divider between sections — lighter than a solid
              border so the three groups read as a single card, not three. */}
          <div
            aria-hidden="true"
            className="border-t border-dashed border-border/60"
          />

          {/* Payments */}
          <section id="payments" className="space-y-5 scroll-mt-24">
            <SectionHeader
              icon={Banknote}
              step={2}
              title="Payments"
              description="Decide whether customers pay a token at booking time and what a no-show costs."
            />

            <Controller
              name="acceptsAdvancePayments"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="acceptsAdvancePayments">
                      Accept advance payments
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Take a token amount when customers book online. Reduces
                      no-shows and locks the slot with a payment.
                    </p>
                  </div>
                  <Switch
                    id="acceptsAdvancePayments"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={field.disabled || busy}
                  />
                </div>
              )}
            />

            <Controller
              name="noShowFee"
              control={control}
              render={({ field, fieldState }) => {
                const value = field.value;
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="noShowFee">No-show fee (₹)</Label>
                      {value !== null ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => field.onChange(null)}
                          disabled={field.disabled || busy}
                          aria-label="Clear no-show fee"
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                    <Input
                      id="noShowFee"
                      type="number"
                      min={0}
                      max={10_000_000}
                      step={1}
                      inputMode="numeric"
                      placeholder="No fee"
                      value={value === null ? "" : value}
                      onChange={(event) => field.onChange(parseNumberOrEmpty(event))}
                      disabled={field.disabled || busy}
                      aria-invalid={fieldState.invalid || undefined}
                      aria-describedby="noShowFee-description"
                    />
                    <p
                      id="noShowFee-description"
                      className="text-xs text-muted-foreground"
                    >
                      {value === null
                        ? "No penalty is charged when a customer skips an appointment."
                        : `Charged when a customer skips: ${appointmentPriceFormatter.format(value)}`}
                    </p>
                    {fieldState.error?.message ? (
                      <p className="text-xs text-destructive">
                        {fieldState.error.message}
                      </p>
                    ) : null}
                  </div>
                );
              }}
            />
          </section>

          <div
            aria-hidden="true"
            className="border-t border-dashed border-border/60"
          />

          {/* Walk-ins */}
          <section id="walk-ins" className="space-y-5 scroll-mt-24">
            <SectionHeader
              icon={DoorOpen}
              step={3}
              title="Walk-ins"
              description="Decide whether customers without a booking are served."
            />

            <Controller
              name="walkInsAllowed"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="walkInsAllowed">Allow walk-in customers</Label>
                    <p className="text-xs text-muted-foreground">
                      Turn off if you only serve customers with a booking. The
                      public detail page reflects this in real time.
                    </p>
                  </div>
                  <Switch
                    id="walkInsAllowed"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={field.disabled || busy}
                  />
                </div>
              )}
            />
          </section>
        </CardContent>

        {canEdit ? (
          <CardFooter
            className={cn(
              "sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t bg-background/80 px-5 py-4 backdrop-blur",
              "sm:static sm:bg-transparent sm:backdrop-blur-none",
            )}
          >
            {/* Unsaved-changes indicator — persists in the sticky footer so
                the owner always knows the form's state without scrolling
                back to the top of the card. The pulsing dot uses the
                semantic warning token (no hardcoded hex); the "saved" state
                uses the success token. aria-live="polite" so screen readers
                announce the state transition without interrupting other
                speech. */}
            <span
              aria-live="polite"
              className={cn(
                "flex items-center gap-2 text-xs transition-opacity",
                busy ? "opacity-0" : "opacity-100",
              )}
            >
              {isDirty ? (
                <>
                  <span
                    aria-hidden="true"
                    className="size-1.5 animate-pulse rounded-full bg-warning"
                  />
                  <span className="font-medium text-foreground">
                    Unsaved changes
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-success"
                  />
                  <span className="text-muted-foreground">
                    All changes saved
                  </span>
                </>
              )}
            </span>

            <Button type="submit" disabled={!isDirty || busy}>
              {busy ? (
                <>
                  <Loader2
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </form>
  );
}
