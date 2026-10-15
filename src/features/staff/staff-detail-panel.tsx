"use client";

import { CalendarDays, CalendarOff, Scissors, Plus, Pencil } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import { WEEKDAYS, WEEKDAY_LABELS } from "./staff-schedule-editor";
import { useState } from "react";
import { toast } from "sonner";

import { FormError } from "@/features/auth/shared/components/form-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/backend.client";

import {
  cancelLeaveApi,
  createLeaveApi,
  replaceSkillsApi,
  updateLeaveApi,
} from "./api";
import type {
  PublicLeave,
  PublicScheduleDay,
  PublicSkill,
  PublicStaffMember,
  StaffServiceOption,
  StaffViewerRole,
} from "./types";

/* ────────────────────────────────────────────────────────────────────────────
 * Top-level panel
 * ──────────────────────────────────────────────────────────────────────────── */

interface StaffDetailPanelProps {
  salonSlug: string;
  staffId: string;
  staff: PublicStaffMember;
  schedule: PublicScheduleDay[];
  leaves: PublicLeave[];
  skills: PublicSkill[];
  /** Active salon services — drives the Skills tab picker. */
  services: StaffServiceOption[];
  /** Viewer's salon-scoped role. OWNER can edit the schedule; MANAGER+ can
   * manage leaves + skills. */
  viewerRole: StaffViewerRole;
  /** The salon's IANA timezone, used to format leave dates + convert date
   * inputs to salon-local ISO datetimes. */
  salonTimezone: string;
  /** Viewer's user id — needed to detect self-view (the backend refuses
   * self-approval of leaves). */
  viewerId: string;
}

/**
 * Schedule / Leaves / Skills tabs for one staff member.
 *
 * Why three separate sub-components instead of one mega-state:
 * Each tab owns its own optimistic state and its own API call. Mixing them
 * would force a single `useState` tree to track schedule, leaves, AND
 * skills at once — any change re-renders every tab. Splitting keeps each
 * tab independent; the parent only re-renders when a tab pushes a
 * `refresh()` (e.g. after a leave mutation we want to re-read the list so
 * the server's authoritative ordering comes back).
 *
 * Why `viewerRole` is checked on the client even though the backend re-checks:
 * The backend's MANAGER+ / OWNER / not-self assertions are the source of
 * truth; the client gates only hide the controls so a salon owner doesn't
 * tap "Save schedule" and see a 403. The API still rejects the call if
 * somehow the role check on the client was bypassed (e.g. devtools).
 */
export function StaffDetailPanel({
  salonSlug,
  staffId,
  staff,
  schedule,
  leaves,
  skills,
  services,
  viewerRole,
  salonTimezone,
  viewerId,
}: StaffDetailPanelProps) {
  const isOwner = viewerRole === "OWNER";
  const canManage = viewerRole === "OWNER" || viewerRole === "MANAGER";
  const isSelf = staff.userId === viewerId;
  const [leaveTick, setLeaveTick] = useState(0);

  return (
    <Tabs defaultValue="schedule" className="gap-4">
      <TabsList
        aria-label="Staff profile sections"
        variant="line"
        className="grid w-full grid-cols-3 gap-0 border-b border-border p-0 group-data-horizontal/tabs:h-auto"
      >
        {[
          { value: "schedule", label: "Schedule", icon: CalendarDays },
          { value: "leaves", label: "Leaves", icon: CalendarOff },
          { value: "skills", label: "Skills", icon: Scissors },
        ].map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="h-12 cursor-pointer gap-2 rounded-none px-2 py-3 text-sm after:bg-primary group-data-horizontal/tabs:after:bottom-[-1px] data-selected:text-primary dark:data-selected:text-primary sm:px-4"
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="schedule">
        <ScheduleTab
          salonSlug={salonSlug}
          schedule={schedule}
          staffRef={staff.slug ?? staff.id}
          canEdit={isOwner}
        />
      </TabsContent>

      <TabsContent value="leaves">
        <LeavesTab
          key={leaveTick}
          salonSlug={salonSlug}
          staffId={staffId}
          leaves={leaves}
          canManage={canManage}
          isSelf={isSelf}
          salonTimezone={salonTimezone}
          onChanged={() => setLeaveTick((n) => n + 1)}
        />
      </TabsContent>

      <TabsContent value="skills">
        <SkillsTab
          salonSlug={salonSlug}
          staffId={staffId}
          skills={skills}
          services={services}
          canEdit={canManage}
        />
      </TabsContent>
    </Tabs>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Schedule tab
 * ──────────────────────────────────────────────────────────────────────────── */

interface ScheduleTabProps {
  salonSlug: string;
  staffRef: string;
  schedule: PublicScheduleDay[];
  canEdit: boolean;
}

function ScheduleTab({ salonSlug, staffRef, schedule, canEdit }: ScheduleTabProps) {
  const rows = [...schedule].sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day));
  return <Card>
    <CardHeader className="flex flex-wrap items-center justify-between gap-3">
      <CardTitle>Weekly schedule</CardTitle>
      {canEdit ? <Button size="sm" variant="outline" render={<Link href={routes.salonStaffSchedule(salonSlug, staffRef)} scroll={false} />}>
        {rows.length ? <Pencil className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
        {rows.length ? "Edit schedule" : "Add schedule"}
      </Button> : null}
    </CardHeader>
    <CardContent>
      {rows.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No schedule added yet.</p> : <ul className="divide-y rounded-lg border px-4">
        {rows.map((day) => <li key={day.day} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span className="font-medium">{WEEKDAY_LABELS[day.day]}</span>{day.isOff ? <Badge variant="secondary">Off</Badge> : <span className="tabular-nums text-muted-foreground">{day.startTime ?? "Not set"} – {day.endTime ?? "Not set"}</span>}</li>)}
      </ul>}
    </CardContent>
  </Card>;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Leaves tab
 * ──────────────────────────────────────────────────────────────────────────── */

interface LeavesTabProps {
  salonSlug: string;
  staffId: string;
  leaves: PublicLeave[];
  canManage: boolean;
  isSelf: boolean;
  salonTimezone: string;
  onChanged: () => void;
}

function LeavesTab({
  salonSlug,
  staffId,
  leaves,
  canManage,
  isSelf,
  salonTimezone,
  onChanged,
}: LeavesTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Leave requests</CardTitle>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Approve or cancel leaves. New requests appear here automatically."
              : "Your leave requests appear here. A manager will approve them."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaves.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No leave requests yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {leaves.map((leave) => (
                <LeaveRow
                  key={leave.id}
                  salonSlug={salonSlug}
                  staffId={staffId}
                  leave={leave}
                  canManage={canManage}
                  isSelf={isSelf}
                  salonTimezone={salonTimezone}
                  onChanged={onChanged}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CreateLeaveCard
        salonSlug={salonSlug}
        staffId={staffId}
        salonTimezone={salonTimezone}
        canCreate={canManage || isSelf}
        onCreated={onChanged}
      />
    </div>
  );
}

interface LeaveRowProps {
  salonSlug: string;
  staffId: string;
  leave: PublicLeave;
  canManage: boolean;
  isSelf: boolean;
  salonTimezone: string;
  onChanged: () => void;
}

function LeaveRow({
  salonSlug,
  staffId,
  leave,
  canManage,
  isSelf,
  salonTimezone,
  onChanged,
}: LeaveRowProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Why isSelf gates approve/reject: the backend throws
  // StaffSelfModificationError when a manager approves their own leave, to
  // prevent self-approval of vacation. We hide the buttons up-front so the
  // failure mode never reaches the user.
  const canApproveOrReject = canManage && !isSelf;

  // Cancel: managers can cancel any leave; self can cancel own pending only.
  const canCancel = canManage || (isSelf && !leave.approved);

  async function setApproval(next: boolean) {
    setError(null);
    setBusy(true);
    try {
      await updateLeaveApi(salonSlug, staffId, leave.id, { approved: next });
      toast.success(next ? "Leave approved." : "Leave rejected.");
      onChanged();
    } catch (caught) {
      setError(extractApiMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setError(null);
    setBusy(true);
    try {
      await cancelLeaveApi(salonSlug, staffId, leave.id);
      toast.success("Leave cancelled.");
      onChanged();
    } catch (caught) {
      setError(extractApiMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const start = formatLeaveDate(leave.startDate, salonTimezone);
  const end = formatLeaveDate(leave.endDate, salonTimezone);

  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{start} → {end}</span>
            <Badge variant={leave.approved ? "secondary" : "outline"}>
              {leave.approved ? "Approved" : "Pending"}
            </Badge>
          </div>
          {leave.reason ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {leave.reason}
            </p>
          ) : null}
        </div>
        {(canApproveOrReject || canCancel) && (
          <div className="flex flex-wrap gap-2">
            {canApproveOrReject && !leave.approved ? (
              <Button
                size="sm"
                onClick={() => setApproval(true)}
                disabled={busy}
              >
                Approve
              </Button>
            ) : null}
            {canApproveOrReject && leave.approved ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setApproval(false)}
                disabled={busy}
              >
                Reject
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={cancel}
                disabled={busy}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        )}
      </div>
      {error ? <FormError>{error}</FormError> : null}
    </li>
  );
}

interface CreateLeaveCardProps {
  salonSlug: string;
  staffId: string;
  salonTimezone: string;
  canCreate: boolean;
  onCreated: () => void;
}

function CreateLeaveCard({
  salonSlug,
  staffId,
  salonTimezone,
  canCreate,
  onCreated,
}: CreateLeaveCardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }
    setBusy(true);
    try {
      await createLeaveApi(salonSlug, staffId, {
        startDate: formatDateInputAsISO(startDate, salonTimezone),
        endDate: formatDateInputAsISO(endDate, salonTimezone, true),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      toast.success("Leave request created.");
      setReason("");
      onCreated();
    } catch (caught) {
      setError(extractApiMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  if (!canCreate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Request leave</CardTitle>
          <p className="text-sm text-muted-foreground">
            Only the staff member themselves or a salon manager can request leave.
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request leave</CardTitle>
        <p className="text-sm text-muted-foreground">
          Dates are interpreted in the salon&rsquo;s local timezone.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="leave-start">Start date</Label>
            <Input
              id="leave-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="leave-end">End date</Label>
            <Input
              id="leave-end"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={busy}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="leave-reason">Reason (optional)</Label>
          <Input
            id="leave-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Family function"
            maxLength={500}
            disabled={busy}
          />
        </div>
        {error ? <FormError>{error}</FormError> : null}
        <div className="flex justify-end">
          <Button onClick={submit} disabled={busy}>
            {busy ? "Requesting…" : "Request leave"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Skills tab
 * ──────────────────────────────────────────────────────────────────────────── */

interface SkillsTabProps {
  salonSlug: string;
  staffId: string;
  skills: PublicSkill[];
  services: StaffServiceOption[];
  canEdit: boolean;
}

interface SkillDraft {
  serviceId: string;
  serviceName: string;
  experience: string;
}

function SkillsTab({
  salonSlug,
  staffId,
  skills,
  services,
  canEdit,
}: SkillsTabProps) {
  const [drafts, setDrafts] = useState<SkillDraft[]>(() =>
    skills.map((skill) => ({
      serviceId: skill.serviceId,
      serviceName: skill.service.name,
      experience: skill.experience == null ? "" : String(skill.experience),
    })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = new Set(drafts.map((draft) => draft.serviceId));
  const availableServices = services.filter(
    (service) => !selectedIds.has(service.id),
  );

  function removeSkill(serviceId: string) {
    setDrafts((prev) => prev.filter((d) => d.serviceId !== serviceId));
  }

  function addSkill(serviceId: string) {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    setDrafts((prev) => [
      ...prev,
      { serviceId, serviceName: svc.name, experience: "" },
    ]);
  }

  function updateExperience(serviceId: string, experience: string) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.serviceId === serviceId ? { ...d, experience } : d,
      ),
    );
  }

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await replaceSkillsApi(salonSlug, staffId, {
        skills: drafts.map((draft) => {
          const expNum = Number(draft.experience);
          const experience =
            draft.experience === "" || !Number.isFinite(expNum)
              ? undefined
              : Math.max(0, Math.floor(expNum));
          return { serviceId: draft.serviceId, experience };
        }),
      });
      toast.success("Skills updated.");
    } catch (caught) {
      setError(extractApiMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service skills</CardTitle>
        <p className="text-sm text-muted-foreground">
          {canEdit
            ? "Pick the services this staff member can perform, plus their years of experience."
            : "Only salon managers can edit skills."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {drafts.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No skills yet. Add one below.
          </p>
        ) : (
          <ul className="space-y-2">
            {drafts.map((draft) => (
              <li
                key={draft.serviceId}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <span className="flex-1 font-medium">{draft.serviceName}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={80}
                    value={draft.experience}
                    onChange={(e) =>
                      updateExperience(draft.serviceId, e.target.value)
                    }
                    disabled={!canEdit || busy}
                    aria-label={`${draft.serviceName} experience years`}
                    className="w-20"
                    placeholder="yrs"
                  />
                  <span className="text-xs text-muted-foreground">yrs</span>
                </div>
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSkill(draft.serviceId)}
                    disabled={busy}
                    aria-label={`Remove ${draft.serviceName}`}
                  >
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canEdit ? (
          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <Label htmlFor="skill-add">Add a service</Label>
            {availableServices.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Every salon service is already on this staff member&rsquo;s list.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableServices.map((service) => (
                  <Button
                    key={service.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSkill(service.id)}
                    disabled={busy}
                  >
                    + {service.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {error ? <FormError>{error}</FormError> : null}

        {canEdit ? (
          <div className="flex justify-end">
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save skills"}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Shared client helpers
 * ──────────────────────────────────────────────────────────────────────────── */

/** Extracts a human-readable message from a failed `api` call. */
function extractApiMessage(caught: unknown): string {
  if (caught instanceof ApiError) return caught.message;
  return "Something went wrong. Please try again.";
}

/** Formats a leave's start/end date in the salon's local timezone. */
function formatLeaveDate(value: string | Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: timezone,
    }).format(new Date(value));
  } catch {
    // Unknown timezone falls back to the browser's locale + offset.
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }
}

/**
 * Converts a `yyyy-MM-dd` date input into a salon-local ISO datetime string.
 *
 * Why salon-local (not UTC):
 * The leave's `startDate` is meant to represent "the morning of Jan 15 in
 * the salon's city". Sending UTC midnight would shift it 5.5 hours in IST,
 * which is fine for full-day overlap math but reads wrong on a calendar
 * that displays in IST. Anchoring to the salon's offset keeps the on-screen
 * date stable across timezones.
 *
 * `endOfDay` shifts the time to 23:59:59 so a same-day leave range still
 * has a non-zero interval (otherwise `startDate === endDate` and the
 * overlap query misses parallel leaves on that day).
 */
function formatDateInputAsISO(
  date: string,
  timezone: string,
  endOfDay = false,
): string {
  const offsetMin = salonOffsetMinutes(timezone);
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  const time = endOfDay ? "23:59:59" : "00:00:00";
  return `${date}T${time}${sign}${hh}:${mm}`;
}

/**
 * Returns the salon timezone's current UTC offset (in minutes) using the
 * browser's Intl API.
 *
 * Why a try/catch:
 * Some legacy engines throw on unknown timezone strings. The default of 0
 * (UTC) is a safe fallback — the API still accepts `Z` datetimes.
 */
function salonOffsetMinutes(timezone: string): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    });
    const parts = fmt.formatToParts(new Date());
    const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const match = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === "+" ? 1 : -1;
    const hours = Number.parseInt(match[2], 10);
    const minutes = match[3] ? Number.parseInt(match[3], 10) : 0;
    return sign * (hours * 60 + minutes);
  } catch {
    return 0;
  }
}
