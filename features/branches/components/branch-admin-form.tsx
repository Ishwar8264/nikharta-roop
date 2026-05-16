"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { BranchActionState } from "@/features/branches/actions/branch-admin.actions";
import { BranchFormActions } from "@/features/branches/components/branch-form-actions";
import { BranchFormFields } from "@/features/branches/components/branch-form-fields";
import { BranchLocationPicker } from "@/features/branches/components/branch-location-picker";
import { useBranchFormDraft } from "@/features/branches/components/use-branch-form-draft";
import { toBranchFormData } from "@/features/branches/helpers/branch-form-data";
import { getVisibleBranchFormErrors } from "@/features/branches/helpers/branch-form-rhf";
import { branchFormSchema } from "@/features/branches/helpers/branch-form-validation";
import { getBranchLocationValue } from "@/features/branches/helpers/branch-location-value";
import type { BranchLocationValue } from "@/features/branches/types/branch-location.types";
import type { BranchFormValues } from "@/features/branches/types/branch-form.types";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type BranchAdminFormProps = {
  action: (
    previousState: BranchActionState,
    formData: FormData,
  ) => Promise<BranchActionState>;
  branch?: PublicBranch;
  submitLabel: string;
};

// React Hook Form owns validation while local draft keeps typed data safe.
export function BranchAdminForm({ action, branch, submitLabel }: BranchAdminFormProps) {
  const [state, setState] = React.useState<BranchActionState>({ message: "", success: false });
  const { syncNameField, updateField, values } = useBranchFormDraft(branch);
  const form = useForm<BranchFormValues>({
    mode: "onChange",
    resolver: zodResolver(branchFormSchema),
    values,
  });
  const visibleErrors = getVisibleBranchFormErrors(
    form.formState.errors,
    form.formState.touchedFields,
    form.formState.dirtyFields,
    form.formState.isSubmitted,
  );

  function handleChange(name: keyof BranchFormValues, value: string | boolean) {
    updateField(name, value);
    form.setValue(name, value as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function handleNameBlur(name: keyof BranchFormValues) {
    const syncedValues = syncNameField(name);

    form.setValue("nameHi", syncedValues.nameHi, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("nameEn", syncedValues.nameEn, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function handleValidSubmit(data: BranchFormValues) {
    setState(await action(state, toBranchFormData(data)));
  }

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
        onBlurName={handleNameBlur}
        onChange={handleChange}
        register={form.register}
        values={values}
      />
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <BranchFormActions
        disabled={form.formState.isSubmitting}
        submitLabel={submitLabel}
      />
    </form>
  );
}
