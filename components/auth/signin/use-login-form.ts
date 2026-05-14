"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone } from "lucide-react";

import { startSigninAction } from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";
import {
  type IdentifierMode,
  getLoginIdentifierError,
  getLoginIdentifierSubmitError,
  isNonDigitInput,
  sanitizeDigits,
  sanitizeEmail,
} from "@/components/auth/utils/auth-form-validation";
import { showError, showSuccess } from "@/components/ui/shared/toast/custom-toast";

// Owns login-only client state so the form component stays presentational.
export function useLoginForm() {
  const router = useRouter();
  const [state, setState] = React.useState<AuthActionState | null>(null);
  const [identifierMode, setIdentifierMode] = React.useState<IdentifierMode>("mobile");
  const [identifierError, setIdentifierError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const isMobileMode = identifierMode === "mobile";
  const ActiveIdentifierIcon = isMobileMode ? Phone : Mail;
  // Server availability checks should run only after local format passes.
  const shouldCheckIdentifier = React.useCallback(
    (value: string) => !getLoginIdentifierError(value, identifierMode),
    [identifierMode],
  );

  // Normalize and validate before sending the single identifier to auth action.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const validationError = getLoginIdentifierSubmitError(identifier, identifierMode);

    if (validationError) {
      setIdentifierError(validationError);
      showError("Signin failed", validationError);
      return;
    }

    formData.set("identifier", identifier);

    startTransition(async () => {
      const result = await startSigninAction(formData);
      setState(result);
      if (result.success) {
        showSuccess("OTP sent", result.message);
      } else {
        showError("Signin failed", result.message);
      }

      if (result.success && result.data?.redirectTo) {
        router.push(result.data.redirectTo);
      }
    });
  }
  // Switching modes intentionally clears stale errors and server responses.
  function handleIdentifierModeChange(nextMode: IdentifierMode) {
    setIdentifierMode(nextMode);
    setIdentifierError(null);
    setState(null);
  }
  // Keep the DOM value sanitized so browser autocomplete/paste cannot drift.
  function handleIdentifierChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = isMobileMode
      ? sanitizeDigits(event.currentTarget.value, 10)
      : sanitizeEmail(event.currentTarget.value);

    event.currentTarget.value = nextValue;
    setIdentifierError(getLoginIdentifierError(nextValue, identifierMode));
    setState(null);
  }
  // Prevents non-digits in phone mode before the input value mutates.
  function handleIdentifierBeforeInput(event: React.FormEvent<HTMLInputElement>) {
    if (isMobileMode && isNonDigitInput(event)) {
      event.preventDefault();
    }
  }
  return {
    ActiveIdentifierIcon,
    handleIdentifierBeforeInput,
    handleIdentifierChange,
    handleIdentifierModeChange,
    handleSubmit,
    identifierError,
    identifierMode,
    isMobileMode,
    isPending,
    shouldCheckIdentifier,
    state,
  };
}
