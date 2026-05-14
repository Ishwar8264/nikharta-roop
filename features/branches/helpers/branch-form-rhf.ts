import type { FieldErrors } from "react-hook-form";

import type {
  BranchFormErrors,
  BranchFormValues,
} from "@/features/branches/types/branch-form.types";

type FieldFlags = Partial<Record<keyof BranchFormValues, boolean>>;

// Shows resolver errors only after a user touches or changes that field.
export function getVisibleBranchFormErrors(
  errors: FieldErrors<BranchFormValues>,
  touched: FieldFlags,
  dirty: FieldFlags,
  showAll = false,
) {
  return Object.fromEntries(
    Object.entries(errors)
      .filter(([key]) => showAll || isVisibleField(key, touched, dirty))
      .map(([key, value]) => [key, String(value?.message ?? "")]),
  ) as BranchFormErrors;
}

function isVisibleField(key: string, touched: FieldFlags, dirty: FieldFlags) {
  const field = key as keyof BranchFormValues;

  return Boolean(touched[field] || dirty[field]);
}
