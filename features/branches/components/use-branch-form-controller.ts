"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { branchFormSchema } from "@/features/branches/helpers/branch-form-validation";
import { getBranchFormValues } from "@/features/branches/helpers/branch-form-values";
import { syncBranchNameFields } from "@/features/branches/helpers/branch-name-sync";
import type { BranchFormValues } from "@/features/branches/types/branch-form.types";
import type { PublicBranch } from "@/features/branches/types/branch.types";

// Centralizes React Hook Form setup and value synchronization.
export function useBranchFormController(branch?: PublicBranch) {
  const defaultValues = getBranchFormValues(branch);
  const form = useForm<BranchFormValues>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(branchFormSchema),
  });
  const values = useWatch({
    control: form.control,
    defaultValue: defaultValues,
  }) as BranchFormValues;

  // Keeps RHF dirty, touched, and validation state aligned for custom fields.
  function updateField(name: keyof BranchFormValues, value: string | boolean) {
    form.setValue(name, value as never, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  // Transliteration runs on blur so typing stays natural in both name fields.
  function syncNameField(name: keyof BranchFormValues) {
    const syncedValues = syncBranchNameFields(values, name);

    form.setValue("nameHi", syncedValues.nameHi, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("nameEn", syncedValues.nameEn, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return { form, syncNameField, updateField, values };
}
