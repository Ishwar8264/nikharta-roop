/**
 * Purpose: Debounced identifier availability field for auth forms.
 * Responsibilities: track local input, validate whether checks should run, and display server feedback.
 * Important notes: server calls are delayed so typing does not trigger a request per keypress.
 */
"use client";

import * as React from "react";

import { InputField, type InputFieldProps } from "@/components/ui/shared/input/generic-input";
import { checkIdentifierAction } from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";

type IdentifierCheckFieldProps = Omit<InputFieldProps, "error" | "success"> & {
  clientError?: string;
  purpose: "LOGIN" | "SIGNUP";
  shouldCheck?: (value: string) => boolean;
};

type IdentifierCheckResult = {
  result: AuthActionState;
  value: string;
};

const CHECK_DELAY_MS = 450;

/**
 * Renders an input field that checks email/mobile availability for login or signup flows.
 */
export function IdentifierCheckField({
  clientError,
  helperText,
  name = "identifier",
  onChange,
  purpose,
  shouldCheck,
  ...props
}: IdentifierCheckFieldProps) {
  const [value, setValue] = React.useState(String(props.defaultValue ?? ""));
  const [checkResult, setCheckResult] =
    React.useState<IdentifierCheckResult | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const trimmedValue = value.trim();
  const shouldRunIdentifierCheck =
    Boolean(trimmedValue) && shouldCheck?.(trimmedValue) !== false;

  React.useEffect(() => {
    if (!shouldRunIdentifierCheck) {
      return;
    }

    // Delay avoids firing the server action on every keystroke.
    const timeoutId = window.setTimeout(() => {
      const formData = new FormData();
      formData.set("identifier", trimmedValue);
      formData.set("purpose", purpose);

      startTransition(async () => {
        const response = await checkIdentifierAction(formData);
        // Keep the checked value so stale responses never affect new input.
        setCheckResult({
          result: response,
          value: trimmedValue,
        });
      });
    }, CHECK_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [purpose, shouldRunIdentifierCheck, trimmedValue]);

  const visibleResult =
    trimmedValue && !clientError && checkResult?.value === trimmedValue
      ? checkResult.result
      : null;
  const canContinue = visibleResult?.data?.canContinue;
  const error =
    clientError ||
    (visibleResult && !canContinue ? visibleResult.message : undefined);
  const success = visibleResult && canContinue ? visibleResult.message : undefined;

  return (
    <InputField
      {...props}
      name={name}
      helperText={isPending && !clientError ? "Checking..." : helperText}
      error={error}
      success={success}
      onChange={(event) => {
        onChange?.(event);
        setValue(event.currentTarget.value);
      }}
    />
  );
}
