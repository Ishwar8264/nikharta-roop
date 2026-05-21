/**
 * Purpose: React Hook Form helpers for branch admin forms.
 * Responsibilities: decide which validation errors are visible after touch, dirty, or submit state.
 * Important notes: hidden errors remain available to RHF but are not shown before user interaction.
 */
import type { FieldErrors } from "react-hook-form";

import type {
  BranchFormErrors,
  BranchFormValues,
} from "@/features/branches/types/branch-form.types";

type FieldFlags = Partial<Record<keyof BranchFormValues, boolean>>;

/**
 * Shows resolver errors only after a user touches or changes that field.
 */
export function getVisibleBranchFormErrors(
  errors: FieldErrors<BranchFormValues>,
  touched: FieldFlags,
  dirty: FieldFlags,
  showAll = false,
) {
  return Object.entries(errors).reduce<BranchFormErrors>(
    (visibleErrors, [key, value]) => {
      if (showAll || isVisibleField(key, touched, dirty)) {
        visibleErrors[key as keyof BranchFormValues] = String(value?.message ?? "");
      }

      return visibleErrors;
    },
    {},
  );
}

/**
 * Checks whether one field has been interacted with enough to reveal its error.
 */
function isVisibleField(key: string, touched: FieldFlags, dirty: FieldFlags) {
  const field = key as keyof BranchFormValues;

  return Boolean(touched[field] || dirty[field]);
}
