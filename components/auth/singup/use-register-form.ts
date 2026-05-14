"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { startSignupAction } from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";
import {
  getOptionalEmailError,
  getRequiredMobileError,
  isNonDigitInput,
  sanitizeDigits,
  sanitizeEmail,
} from "@/components/auth/utils/auth-form-validation";
import { showError, showSuccess } from "@/components/ui/shared/toast/custom-toast";

// Owns signup validation, availability checks, and redirect side effects.
export function useRegisterForm() {
  const router = useRouter();
  const [state, setState] = React.useState<AuthActionState | null>(null);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [mobileError, setMobileError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  // Availability API should not run until the field is locally valid.
  const shouldCheckEmail = React.useCallback(
    (value: string) => !getOptionalEmailError(value), []);
  const shouldCheckMobile = React.useCallback(
    (value: string) => !getRequiredMobileError(value), []);

  // Final submit revalidates sanitized values before invoking the server action.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const mobile = String(formData.get("mobile") ?? "").trim();
    const nextEmailError = getOptionalEmailError(email);
    const nextMobileError = getRequiredMobileError(mobile);

    setEmailError(nextEmailError);
    setMobileError(nextMobileError);

    if (nextEmailError || nextMobileError) {
      showError("Signup failed", nextEmailError ?? nextMobileError ?? undefined);
      return;
    }

    formData.set("email", email);
    formData.set("mobile", mobile);

    startTransition(async () => {
      const result = await startSignupAction(formData);
      setState(result);
      if (result.success) {
        showSuccess("OTP sent", result.message);
      } else {
        showError("Signup failed", result.message);
      }

      if (result.success && result.data?.redirectTo) {
        router.push(result.data.redirectTo);
      }
    });
  }
  // Email paste cleanup avoids hidden spaces that pass visual inspection.
  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = sanitizeEmail(event.currentTarget.value);

    event.currentTarget.value = nextValue;
    setEmailError(getOptionalEmailError(nextValue));
    setState(null);
  }
  // Mobile stays digit-only and capped to the Indian 10-digit format.
  function handleMobileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = sanitizeDigits(event.currentTarget.value, 10);

    event.currentTarget.value = nextValue;
    setMobileError(nextValue ? getRequiredMobileError(nextValue) : null);
    setState(null);
  }
  // Rejects typed non-digits before they briefly appear in the input.
  function handleMobileBeforeInput(event: React.FormEvent<HTMLInputElement>) {
    if (isNonDigitInput(event)) {
      event.preventDefault();
    }
  }
  return {
    emailError,
    handleEmailChange,
    handleMobileBeforeInput,
    handleMobileChange,
    handleSubmit,
    isPending,
    mobileError,
    shouldCheckEmail,
    shouldCheckMobile,
    state,
  };
}
