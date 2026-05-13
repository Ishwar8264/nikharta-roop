"use client";

import * as React from "react";

import { InputField, type InputFieldProps } from "@/components/ui/shared/input/generic-input";
import { checkIdentifierAction } from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";

type IdentifierCheckFieldProps = Omit<InputFieldProps, "error" | "success"> & {
  purpose: "LOGIN" | "SIGNUP";
};

const CHECK_DELAY_MS = 450;

export function IdentifierCheckField({
  helperText,
  name = "identifier",
  onChange,
  purpose,
  ...props
}: IdentifierCheckFieldProps) {
  const [value, setValue] = React.useState(String(props.defaultValue ?? ""));
  const [result, setResult] = React.useState<AuthActionState | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setResult(null);
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
  }, [purpose, value]);

  const canContinue = result?.data?.canContinue;
  const error = result && !canContinue ? result.message : undefined;
  const success = result && canContinue ? result.message : undefined;

  return (
    <InputField
      {...props}
      name={name}
      helperText={isPending ? "Checking..." : helperText}
      error={error}
      success={success}
      onChange={(event) => {
        setValue(event.currentTarget.value);
        onChange?.(event);
      }}
    />
  );
}
