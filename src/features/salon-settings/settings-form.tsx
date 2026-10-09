"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
        <CardContent className="space-y-8">
          {/* Booking */}
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Booking
              </h2>
              <p className="text-xs text-muted-foreground">
                Control how far in advance customers can book and the gaps
                between appointments.
              </p>
            </div>

            <Controller
              name="bufferMinutes"
              control={control}
              render={({ field, fieldState }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="bufferMinutes">
                    Buffer between appointments (minutes)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={field.value}
                      onValueChange={field.onChange}
                      min={0}
                      max={30}
                      step={5}
                      disabled={field.disabled || busy}
                      aria-label="Buffer minutes slider"
                      className="flex-1"
                    />
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
                      className="w-20"
                    />
                  </div>
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
              error={errors.cancellationWindowHours?.message}
              {...register("cancellationWindowHours", {
                setValueAs: (value) => {
                  if (value === "" || value === null) return Number.NaN;
                  return Number(value);
                },
              })}
            />
          </section>

          {/* Payments */}
          <section className="space-y-4 border-t pt-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Payments
              </h2>
              <p className="text-xs text-muted-foreground">
                Decide whether customers pay a token at booking time and what a
                no-show costs.
              </p>
            </div>

            <Controller
              name="acceptsAdvancePayments"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <Label htmlFor="acceptsAdvancePayments">
                      Accept advance payments
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Take a token amount when customers book online.
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
                    />
                    <p className="text-xs text-muted-foreground">
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

          {/* Walk-ins */}
          <section className="space-y-4 border-t pt-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Walk-ins
              </h2>
              <p className="text-xs text-muted-foreground">
                Decide whether customers without a booking are served.
              </p>
            </div>

            <Controller
              name="walkInsAllowed"
              control={control}
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <Label htmlFor="walkInsAllowed">Allow walk-in customers</Label>
                    <p className="text-xs text-muted-foreground">
                      Turn off if you only serve customers with a booking.
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
              "sticky bottom-0 z-10 flex justify-end gap-3 border-t bg-background/80 px-5 py-4 backdrop-blur sm:static sm:bg-transparent sm:backdrop-blur-none",
            )}
          >
            <Button type="submit" disabled={!isDirty || busy}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </form>
  );
}
