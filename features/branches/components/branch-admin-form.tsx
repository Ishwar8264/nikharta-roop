"use client";

import * as React from "react";

import type { BranchActionState } from "@/features/branches/actions/branch-admin.actions";
import { UnsavedChangesDialog } from "@/components/ui/shared/alertbox/unsaved-changes-dialog";
import { BranchFormActions } from "@/features/branches/components/branch-form-actions";
import { BranchFormFields } from "@/features/branches/components/branch-form-fields";
import { BranchLocationPicker } from "@/features/branches/components/branch-location-picker";
import { useBranchFormController } from "@/features/branches/components/use-branch-form-controller";
import { toBranchFormData } from "@/features/branches/helpers/branch-form-data";
import { getVisibleBranchFormErrors } from "@/features/branches/helpers/branch-form-rhf";
import { getBranchLocationValue } from "@/features/branches/helpers/branch-location-value";
import type { BranchLocationValue } from "@/features/branches/types/branch-location.types";
import type { BranchFormValues } from "@/features/branches/types/branch-form.types";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { useUnsavedChangesGuard } from "@/features/forms/hooks/use-unsaved-changes-guard";

type BranchAdminFormProps = {
  action: (
    previousState: BranchActionState,
    formData: FormData,
  ) => Promise<BranchActionState>;
  branch?: PublicBranch;
  submitLabel: string;
};

// Client shell coordinates RHF, location selection, submit state, and navigation guard.
export function BranchAdminForm({ action, branch, submitLabel }: BranchAdminFormProps) {
  const [state, setState] = React.useState<BranchActionState>({ message: "", success: false });
  const { form, syncNameField, updateField, values } = useBranchFormController(branch);
  const guard = useUnsavedChangesGuard(
    form.formState.isDirty && !form.formState.isSubmitting,
  );
  const visibleErrors = getVisibleBranchFormErrors(
    form.formState.errors,
    form.formState.touchedFields,
    form.formState.dirtyFields,
    form.formState.isSubmitted,
  );

  function handleChange(name: keyof BranchFormValues, value: string | boolean) {
    updateField(name, value);
  }

  // Server actions still receive FormData while RHF owns the browser form state.
  async function handleValidSubmit(data: BranchFormValues) {
    setState(await action(state, toBranchFormData(data)));
  }

  // Google Maps selection updates every persisted branch location field together.
  function handleLocationChange(location: BranchLocationValue) {
    Object.entries(location).forEach(([name, value]) => {
      handleChange(name as keyof BranchFormValues, value);
    });
  }

  return (
    <form className="space-y-5" noValidate onSubmit={form.handleSubmit(handleValidSubmit)}>
      <BranchLocationPicker
        onChange={handleLocationChange}
        value={getBranchLocationValue(values)}
      />
      <BranchFormFields
        errors={visibleErrors}
        onBlurName={syncNameField}
        onChange={handleChange}
        register={form.register}
        values={values}
      />
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <BranchFormActions
        disabled={form.formState.isSubmitting}
        submitLabel={submitLabel}
      />
      <UnsavedChangesDialog
        onDiscard={guard.discardChanges}
        onOpenChange={guard.setIsDialogOpen}
        open={guard.isDialogOpen}
      />
    </form>
  );
}
