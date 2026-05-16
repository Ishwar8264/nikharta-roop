"use client";

import * as React from "react";

import {
  getBranchFormValues,
  mergeBranchDraft,
} from "@/features/branches/helpers/branch-form-values";
import { syncBranchNameFields } from "@/features/branches/helpers/branch-name-sync";
import type { BranchFormValues } from "@/features/branches/types/branch-form.types";
import type { PublicBranch } from "@/features/branches/types/branch.types";

// Persists branch form drafts so validation errors or refreshes do not wipe input.
export function useBranchFormDraft(branch?: PublicBranch) {
  const draftKey = `branch-form:${branch?.id ?? "new"}`;
  const defaults = React.useMemo(() => getBranchFormValues(branch), [branch]);
  const isDraftLoaded = React.useRef(false);
  const [values, setValues] = React.useState(defaults);

  React.useEffect(() => {
    let isCurrentDraft = true;

    isDraftLoaded.current = false;

    queueMicrotask(() => {
      if (!isCurrentDraft) return;

      const storedDraft = window.localStorage.getItem(draftKey);
      if (!storedDraft) {
        setValues(defaults);
        isDraftLoaded.current = true;
        return;
      }

      try {
        setValues(mergeBranchDraft(defaults, JSON.parse(storedDraft)));
      } catch {
        window.localStorage.removeItem(draftKey);
        setValues(defaults);
      }

      isDraftLoaded.current = true;
    });

    return () => {
      isCurrentDraft = false;
    };
  }, [defaults, draftKey]);

  React.useEffect(() => {
    if (!isDraftLoaded.current) return;

    window.localStorage.setItem(draftKey, JSON.stringify(values));
  }, [draftKey, values]);

  function updateField(name: keyof BranchFormValues, value: string | boolean) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function syncNameField(name: keyof BranchFormValues) {
    const nextValues = syncBranchNameFields(values, name);

    setValues(nextValues);

    return nextValues;
  }

  function clearDraft() {
    window.localStorage.removeItem(draftKey);
  }

  return { clearDraft, syncNameField, updateField, values };
}
