"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import type {
  BranchActionState,
} from "@/features/branches/actions/branch-admin.actions";
import { BranchFormFields } from "@/features/branches/components/branch-form-fields";
import { BranchSubmitButton } from "@/features/branches/components/branch-submit-button";
import { useBranchFormDraft } from "@/features/branches/components/use-branch-form-draft";
import {
  hasBranchFormErrors,
  validateBranchForm,
} from "@/features/branches/helpers/branch-form-validation";
import type { PublicBranch } from "@/features/branches/types/branch.types";

type BranchAdminFormProps = {
  action: (
    previousState: BranchActionState,
    formData: FormData,
  ) => Promise<BranchActionState>;
  branch?: PublicBranch;
  submitLabel: string;
};

// Client shell owns useActionState while fields remain reusable.
export function BranchAdminForm({
  action,
  branch,
  submitLabel,
}: BranchAdminFormProps) {
  const [state, formAction] = React.useActionState(action, {
    message: "",
    success: false,
  });
  const { updateField, values } = useBranchFormDraft(branch);
  const errors = React.useMemo(() => validateBranchForm(values), [values]);
  const isInvalid = hasBranchFormErrors(errors);

  return (
    <form action={formAction} className="space-y-5">
      <BranchFormFields
        errors={errors}
        onChange={updateField}
        values={values}
      />
      {state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <BranchSubmitButton disabled={isInvalid} label={submitLabel} />
        <Button asChild type="button" variant="outline">
          <Link href="/admin/branches">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
