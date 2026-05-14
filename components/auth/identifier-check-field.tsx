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

// Debounced identifier availability field used by login and signup.
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

  React.useEffect(() => {
    const trimmedValue = value.trim();

    if (!trimmedValue || shouldCheck?.(trimmedValue) === false) {
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
  }, [purpose, shouldCheck, value]);

  const trimmedValue = value.trim();
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
