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

const CHECK_DELAY_MS = 450;

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
  const [result, setResult] = React.useState<AuthActionState | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const trimmedValue = value.trim();

    if (!trimmedValue || shouldCheck?.(trimmedValue) === false) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const formData = new FormData();
      formData.set("identifier", trimmedValue);
      formData.set("purpose", purpose);

      startTransition(async () => {
        const response = await checkIdentifierAction(formData);
        setResult(response);
      });
    }, CHECK_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [purpose, shouldCheck, value]);

  const visibleResult = value.trim() && !clientError ? result : null;
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
