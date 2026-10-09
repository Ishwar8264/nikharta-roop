"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { FormHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormError } from "@/features/auth/shared/components/form-error";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { replaceWorkingHoursApi } from "./api";
import type { DayOfWeek, PublicWorkingHours } from "./types";

/**
 * The seven days the salon-week is composed of, ordered Mon→Sun to match the
 * public detail sidebar and the calendar's natural left-to-right scan.
 */
const WEEK_DAYS: readonly DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Browser-safe mirror of `replaceWorkingHoursSchema`.
 *
 * Why we redeclare instead of importing:
 * The server schema lives in a `server-only` module. Importing it from a
 * Client Component would pull the server tree into the browser bundle.
 * The rules are identical: 7 days, no duplicates, `openTime`/`closeTime`
 * required when not closed, and close must be after open.
 */
const dayEntrySchema = z
  .object({
    day: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    openTime: z.string().regex(timePattern, "Use HH:mm").optional(),
    closeTime: z.string().regex(timePattern, "Use HH:mm").optional(),
    isClosed: z.boolean(),
  })
  .refine(
    (day) => day.isClosed || (Boolean(day.openTime) && Boolean(day.closeTime)),
    { message: "Open and close times are required when not closed" },
  )
  .refine(
    (day) => {
      if (day.isClosed || !day.openTime || !day.closeTime) return true;
      return day.openTime < day.closeTime;
    },
    { message: "Close time must be later than open time" },
  );

const workingHoursFormSchema = z
  .object({
    days: z.array(dayEntrySchema).length(7, "Exactly 7 days are required"),
  })
  .refine(
    (input) => {
      const seen = new Set<string>();
      for (const day of input.days) {
        if (seen.has(day.day)) return false;
        seen.add(day.day);
      }
      return true;
    },
    { message: "Each day may appear at most once" },
  );

type WorkingHoursFormValues = z.infer<typeof workingHoursFormSchema>;

interface DayRow {
  day: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

/**
 * Builds the form's default rows from the server-preloaded hours.
 *
 * Why this normalisation lives here:
 * The server returns 0–7 rows (a brand-new salon may have none). The form's
 * invariant is "always 7 rows in Mon→Sun order", so we backfill missing days
 * with a sane default (09:00–18:00, open) and strip the row `id` — the PUT
 * endpoint treats the payload as a wholesale replacement, not an update.
 */
function buildInitialDays(initial: PublicWorkingHours[]): DayRow[] {
  const byDay = new Map<DayOfWeek, PublicWorkingHours>();
  for (const row of initial) byDay.set(row.day, row);

  return WEEK_DAYS.map((day) => {
    const row = byDay.get(day);
    return {
      day,
      openTime: row?.openTime ?? "09:00",
      closeTime: row?.closeTime ?? "18:00",
      isClosed: row?.isClosed ?? false,
    };
  });
}

interface WorkingHoursFormProps {
  salonSlug: string;
  salonName: string;
  initial: PublicWorkingHours[];
}

/**
 * Weekly schedule editor for a salon. One row per weekday with start/end time
 * inputs and an "Off" toggle. PUT-ing the full week keeps the server invariant
 * "exactly 7 rows, close > open" enforceable in one transaction.
 */
export function WorkingHoursForm({
  salonSlug,
  salonName,
  initial,
}: WorkingHoursFormProps) {
  const [busy, setBusy] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<WorkingHoursFormValues>({
    resolver: zodResolver(workingHoursFormSchema),
    defaultValues: { days: buildInitialDays(initial) },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const days = watch("days");

  /**
   * Toggles one day's `isClosed` flag and clears the time inputs when going
   * "off" so the row visually reads as inert. Going back to "open" restores
   * a sane 09:00–18:00 default rather than the previous closed-day values,
   * which would otherwise be the literal "00:00" the server stored.
   */
  function toggleClosed(index: number, nextClosed: boolean) {
    setValue(
      `days.${index}.isClosed`,
      nextClosed,
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
    if (nextClosed) {
      setValue(`days.${index}.openTime`, "00:00", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`days.${index}.closeTime`, "00:00", {
        shouldDirty: true,
        shouldValidate: true,
      });
    } else {
      setValue(`days.${index}.openTime`, "09:00", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue(`days.${index}.closeTime`, "18:00", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function submit(values: WorkingHoursFormValues) {
    setFormMessage(null);
    setBusy(true);
    try {
      const response = await replaceWorkingHoursApi(salonSlug, {
        days: values.days.map((day) => ({
          day: day.day,
          openTime: day.isClosed ? undefined : day.openTime,
          closeTime: day.isClosed ? undefined : day.closeTime,
          isClosed: day.isClosed,
        })),
      });
      // Re-seed the form with the persisted rows so the dirty flag clears and
      // a subsequent no-op save is correctly recognised as such.
      reset({ days: buildInitialDays(response.data.hours) });
      toast.success("Working hours saved.");
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFormMessage(caught.message);
      } else {
        setFormMessage("Could not save working hours. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  const dayErrors = errors.days;
  const topLevelError =
    dayErrors && !Array.isArray(dayErrors) ? dayErrors.message : null;

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <FormHeader
        title="Working hours"
        description={`${salonName} · The weekly schedule customers see on your public page.`}
      />

      {formMessage ? <FormError>{formMessage}</FormError> : null}
      {topLevelError ? <FormError>{topLevelError}</FormError> : null}

      <Card>
        <CardContent className="space-y-3">
          <div
            className={cn(
              "hidden grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid",
            )}
          >
            <span>Day</span>
            <span className="w-24 text-center">Opens</span>
            <span className="w-24 text-center">Closes</span>
            <span className="w-16 text-center">Off</span>
          </div>

          {days.map((day, index) => {
            const fieldError = Array.isArray(errors.days)
              ? errors.days[index]
              : undefined;
            const rowMessage =
              fieldError && !Array.isArray(fieldError)
                ? fieldError.message
                : null;

            return (
              <div
                key={day.day}
                className={cn(
                  "grid grid-cols-1 gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center",
                  day.isClosed && "opacity-60",
                )}
              >
                <div className="flex items-center justify-between gap-3 sm:justify-start">
                  <Label
                    htmlFor={`day-${day.day}-open`}
                    className="text-sm font-medium"
                  >
                    {DAY_LABELS[day.day]}
                  </Label>
                  {day.isClosed ? (
                    <span className="text-xs uppercase tracking-wide text-muted-foreground sm:hidden">
                      Closed
                    </span>
                  ) : null}
                </div>

                <Input
                  id={`day-${day.day}-open`}
                  type="time"
                  value={day.openTime}
                  disabled={day.isClosed || busy}
                  aria-label={`${DAY_LABELS[day.day]} opening time`}
                  className="sm:w-24"
                  {...register(`days.${index}.openTime`)}
                />
                <Input
                  id={`day-${day.day}-close`}
                  type="time"
                  value={day.closeTime}
                  disabled={day.isClosed || busy}
                  aria-label={`${DAY_LABELS[day.day]} closing time`}
                  className="sm:w-24"
                  {...register(`days.${index}.closeTime`)}
                />

                <div className="flex items-center justify-end gap-2">
                  <Label
                    htmlFor={`day-${day.day}-closed`}
                    className="sr-only"
                  >
                    {DAY_LABELS[day.day]} closed
                  </Label>
                  <Switch
                    id={`day-${day.day}-closed`}
                    checked={day.isClosed}
                    onCheckedChange={(checked) =>
                      toggleClosed(index, Boolean(checked))
                    }
                    disabled={busy}
                    aria-label={`${DAY_LABELS[day.day]} off`}
                  />
                </div>

                {rowMessage ? (
                  <p
                    role="alert"
                    className="col-span-full text-xs text-destructive"
                  >
                    {rowMessage}
                  </p>
                ) : null}
              </div>
            );
          })}
        </CardContent>

        <CardFooter className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t bg-background/80 px-5 py-4 backdrop-blur sm:static sm:bg-transparent sm:backdrop-blur-none">
          <p className="text-xs text-muted-foreground">
            Changes take effect for new bookings immediately.
          </p>
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
              "Save hours"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
