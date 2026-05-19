/**
 * Purpose: Client form shell for creating admin staff profiles.
 * Responsibilities: collect user, branch, working hours, availability, and initial service assignments.
 * Important notes: the form uses the shared unsaved-changes guard before navigation or reload.
 */
"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UnsavedChangesDialog } from "@/components/ui/shared/alertbox/unsaved-changes-dialog";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import type { StaffActionState } from "@/features/staff/actions/staff-admin.actions";
import type {
  StaffServiceOption,
  StaffUserOption,
} from "@/features/staff/types/staff.types";
import { useUnsavedChangesGuard } from "@/features/forms/hooks/use-unsaved-changes-guard";

type StaffAdminFormProps = {
  action: (
    previousState: StaffActionState,
    formData: FormData,
  ) => Promise<StaffActionState>;
  branches: PublicBranch[];
  serviceOptions: StaffServiceOption[];
  userOptions: StaffUserOption[];
};

const WORK_DAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

/**
 * Renders the create staff form with branch-scoped service choices.
 */
export function StaffAdminForm({
  action,
  branches,
  serviceOptions,
  userOptions,
}: StaffAdminFormProps) {
  const [state, setState] = React.useState<StaffActionState>({
    message: "",
    success: false,
  });
  const [isPending, startTransition] = React.useTransition();
  const [isDirty, setIsDirty] = React.useState(false);
  const [branchId, setBranchId] = React.useState(branches[0]?.id ?? "");
  const [userId, setUserId] = React.useState(userOptions[0]?.id ?? "");
  const [isAvailable, setIsAvailable] = React.useState(true);
  const guard = useUnsavedChangesGuard(isDirty && !isPending);
  const visibleServices = serviceOptions.filter(
    (service) => service.branchId === branchId,
  );

  /**
   * Sends form data to the API-backed server action.
   */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setState(await action(state, formData));
    });
  }

  /**
   * Marks uncontrolled text, number, time, and checkbox changes as dirty.
   */
  function handleFieldChange() {
    setIsDirty(true);
  }

  /**
   * Updates branch scope and enables the unsaved changes prompt.
   */
  function handleBranchChange(nextBranchId: string) {
    setIsDirty(true);
    setBranchId(nextBranchId);
  }

  /**
   * Updates selected user and enables the unsaved changes prompt.
   */
  function handleUserChange(nextUserId: string) {
    setIsDirty(true);
    setUserId(nextUserId);
  }

  /**
   * Updates availability and enables the unsaved changes prompt.
   */
  function handleAvailabilityChange(nextIsAvailable: boolean) {
    setIsDirty(true);
    setIsAvailable(nextIsAvailable);
  }

  return (
    <form
      className="grid gap-5"
      noValidate
      onChangeCapture={handleFieldChange}
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field htmlFor="branchId" label="Branch">
          <Select name="branchId" onValueChange={handleBranchChange} value={branchId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.nameHi}, {branch.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field htmlFor="userId" label="User">
          <Select
            disabled={userOptions.length === 0}
            name="userId"
            onValueChange={handleUserChange}
            value={userId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {userOptions.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {userOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No active customer user is available for staff profile creation.
            </p>
          ) : null}
        </Field>

        <Field htmlFor="workStart" label="Work starts">
          <Input
            defaultValue="10:00"
            id="workStart"
            name="workStart"
            required
            type="time"
          />
        </Field>

        <Field htmlFor="workEnd" label="Work ends">
          <Input
            defaultValue="19:00"
            id="workEnd"
            name="workEnd"
            required
            type="time"
          />
        </Field>

        <Field htmlFor="experienceYears" label="Experience years">
          <Input
            id="experienceYears"
            inputMode="numeric"
            name="experienceYears"
            placeholder="3"
            type="number"
          />
        </Field>

        <Field htmlFor="specialization" label="Specialization">
          <Input
            id="specialization"
            name="specialization"
            placeholder="Facial, Hair, Bridal"
          />
        </Field>
      </div>

      <Field htmlFor="workDays" label="Work days">
        <div className="flex flex-wrap gap-2">
          {WORK_DAY_OPTIONS.map((day) => (
            <label
              className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"
              key={day.value}
            >
              <input
                defaultChecked={day.value >= 1 && day.value <= 6}
                name="workDays"
                type="checkbox"
                value={day.value}
              />
              {day.label}
            </label>
          ))}
        </div>
      </Field>

      <Field htmlFor="serviceIds" label="Initial services">
        {visibleServices.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {visibleServices.map((service) => (
              <label
                className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm"
                key={service.id}
              >
                <input name="serviceIds" type="checkbox" value={service.id} />
                {service.nameHi}
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active services are available for this branch yet.
          </p>
        )}
      </Field>

      <Field htmlFor="bioHi" label="Hindi bio">
        <Textarea id="bioHi" name="bioHi" placeholder="Staff profile details" />
      </Field>

      <Field htmlFor="bioEn" label="English bio">
        <Textarea id="bioEn" name="bioEn" placeholder="Short English bio" />
      </Field>

      <div className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
        <div>
          <Label htmlFor="isAvailable">Available</Label>
          <p className="text-xs text-muted-foreground">
            Available staff can appear in booking slot assignment.
          </p>
        </div>
        <Switch
          checked={isAvailable}
          id="isAvailable"
          name="isAvailable"
          onCheckedChange={handleAvailabilityChange}
        />
      </div>

      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

      <Button disabled={isPending || !branchId || !userId} type="submit">
        {isPending ? "Creating..." : "Create staff"}
      </Button>
      <UnsavedChangesDialog
        onDiscard={guard.discardChanges}
        onOpenChange={guard.setIsDialogOpen}
        open={guard.isDialogOpen}
      />
    </form>
  );
}

type FieldProps = {
  children: React.ReactNode;
  htmlFor: string;
  label: string;
};

/**
 * Keeps label/input spacing consistent across the staff form.
 */
function Field({ children, htmlFor, label }: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
