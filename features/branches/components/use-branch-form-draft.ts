"use client";

import * as React from "react";

import {
  getBranchFormValues,
  mergeBranchDraft,
} from "@/features/branches/helpers/branch-form-values";
import type { BranchFormValues } from "@/features/branches/types/branch-form.types";
import type { PublicBranch } from "@/features/branches/types/branch.types";

// Persists branch form drafts so validation errors or refreshes do not wipe input.
export function useBranchFormDraft(branch?: PublicBranch) {
  const draftKey = `branch-form:${branch?.id ?? "new"}`;
  const defaults = React.useMemo(() => getBranchFormValues(branch), [branch]);
  const [values, setValues] = React.useState(() => {
    if (typeof window === "undefined") return defaults;

    const storedDraft = window.localStorage.getItem(draftKey);
    if (!storedDraft) return defaults;

    try {
      return mergeBranchDraft(defaults, JSON.parse(storedDraft));
    } catch {
      window.localStorage.removeItem(draftKey);
      return defaults;
    }
  });

  React.useEffect(() => {
    window.localStorage.setItem(draftKey, JSON.stringify(values));
  }, [draftKey, values]);

  function updateField(name: keyof BranchFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function clearDraft() {
    window.localStorage.removeItem(draftKey);
  }

  return { clearDraft, updateField, values };
}
