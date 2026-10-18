"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeField } from "@/components/ui/time-field";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FormError } from "@/features/auth/shared/components/form-error";
import { ApiError } from "@/lib/api/backend.client";
import { replaceScheduleApi } from "./api";
import type { PublicScheduleDay } from "./types";

export const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const WEEKDAY_LABELS: Record<(typeof WEEKDAYS)[number], string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

/** Working row shape — kept separate from the read-only `PublicScheduleDay`
 * because the editor needs to mutate `startTime` / `endTime` before sending. */
interface ScheduleEditorDay {
  day: (typeof WEEKDAYS)[number];
  startTime: string;
  endTime: string;
  isOff: boolean;
}

/** Fills missing days with "off" defaults so the PUT body always has 7 rows. */
function buildEditorDays(schedule: PublicScheduleDay[]): ScheduleEditorDay[] {
  const byDay = new Map<string, PublicScheduleDay>();
  for (const row of schedule) byDay.set(row.day, row);

  return WEEKDAYS.map((day) => {
    const existing = byDay.get(day);
    return {
      day,
      startTime: existing?.startTime ?? "09:00",
      endTime: existing?.endTime ?? "18:00",
      isOff: existing?.isOff ?? true,
    };
  });
}

export function StaffScheduleEditor({
  salonSlug,
  staffId,
  schedule,
  detailHref,
  modal = false,
}: { salonSlug: string; staffId: string; schedule: PublicScheduleDay[]; detailHref: string; modal?: boolean }) {
  const router = useRouter();
  const [days, setDays] = useState<ScheduleEditorDay[]>(() =>
    buildEditorDays(schedule),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateDay(
    index: number,
    patch: Partial<ScheduleEditorDay>,
  ): void {
    setDays((prev) =>
      prev.map((day, i) => (i === index ? { ...day, ...patch } : day)),
    );
  }

  async function save() {
    if (busy) return;
    const invalidDay = days.find((day) => !day.isOff && (!day.startTime || !day.endTime || day.endTime <= day.startTime));
    if (invalidDay) {
      setError(`${WEEKDAY_LABELS[invalidDay.day]}: end time must be later than start time.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await replaceScheduleApi(salonSlug, staffId, {
        days: days.map((day) => ({
          day: day.day,
          startTime: day.isOff ? undefined : day.startTime,
          endTime: day.isOff ? undefined : day.endTime,
          isOff: day.isOff,
        })),
      });
      toast.success("Schedule updated.");
      router.replace(detailHref, { scroll: false });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to save schedule. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    if (busy) return;
    if (modal) router.back();
    else router.replace(detailHref, { scroll: false });
  }

  const content = (
    <form
      data-form-rounded="true"
      className={`flex min-h-0 flex-col ${modal ? "max-h-[90dvh]" : "overflow-hidden rounded-xl border border-border bg-card"}`}
      onSubmit={(event) => { event.preventDefault(); void save(); }}
    >
      <header className="shrink-0 space-y-3 border-b border-border px-4 py-3">
        <Button type="button" variant="ghost" size="sm" className="-ml-2 w-fit gap-1.5 text-muted-foreground" disabled={busy} onClick={goBack}>
          <ArrowLeft className="size-4" aria-hidden="true" /> Back
        </Button>
        <div className="space-y-1">
          {modal ? <DialogTitle className="text-lg font-semibold">Weekly schedule</DialogTitle> : <h1 className="text-lg font-semibold">Weekly schedule</h1>}
          <p className="text-xs text-muted-foreground">Working hours use the salon&rsquo;s local timezone.</p>
        </div>
      </header>
      <div className="min-h-0 space-y-1 overflow-y-auto px-4 py-2">
        <div className="hidden grid-cols-[2.5rem_6rem_minmax(0,1fr)] gap-3 pb-1 text-xs text-muted-foreground sm:grid" aria-hidden="true">
          <span>Day</span><span>Status</span><div className="grid grid-cols-2 gap-3"><span className="px-2">Start time</span><span className="px-2">End time</span></div>
        </div>
        <div className="divide-y divide-border">
          {days.map((day, index) => (
            <div key={day.day} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-2 sm:grid-cols-[2.5rem_6rem_minmax(0,1fr)]">
              <span className="text-sm font-medium">{WEEKDAY_LABELS[day.day]}</span>
              <div className="flex items-center gap-2">
                <Switch checked={!day.isOff} onCheckedChange={(checked) => updateDay(index, { isOff: !checked })} disabled={busy} aria-label={`${WEEKDAY_LABELS[day.day]} working`} />
                <span className={`text-xs ${day.isOff ? "text-muted-foreground" : "text-foreground"}`}>{day.isOff ? "Off" : "Working"}</span>
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                {day.isOff ? <span className="text-xs text-muted-foreground">Day off</span> : (
                  <div className="grid min-w-0 grid-cols-2 items-center gap-3">
                    <TimeField value={day.startTime} onChange={(value) => updateDay(index, { startTime: value })} disabled={busy} label={`${WEEKDAY_LABELS[day.day]} start time`} />
                    <TimeField value={day.endTime} onChange={(value) => updateDay(index, { endTime: value })} disabled={busy} label={`${WEEKDAY_LABELS[day.day]} end time`} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {error ? <FormError>{error}</FormError> : null}
      </div>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-border bg-card px-4 py-3">
        <Button type="button" variant="outline" disabled={busy} onClick={goBack}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save schedule"}</Button>
      </footer>
    </form>
  );
  if (!modal) return content;
  return (
    <Dialog open onOpenChange={(open) => { if (!open) goBack(); }}>
      <DialogContent showCloseButton={!busy} className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogDescription className="sr-only">Edit weekly staff working hours.</DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  );
}
