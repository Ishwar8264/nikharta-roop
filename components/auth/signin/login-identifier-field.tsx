"use client";

import * as React from "react";

import {
  authInputClassName,
} from "@/components/auth/auth-ui";
import { IdentifierCheckField } from "@/components/auth/identifier-check-field";
import type { IdentifierMode } from "@/components/auth/utils/auth-form-validation";

type LoginIdentifierFieldProps = {
  Icon: React.ComponentType<{ className?: string }>;
  error?: string;
  isMobileMode: boolean;
  mode: IdentifierMode;
  onBeforeInput: (event: React.FormEvent<HTMLInputElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  shouldCheck: (value: string) => boolean;
};

// Renders the active login identifier while preserving one backend field name.
export function LoginIdentifierField({
  Icon,
  error,
  isMobileMode,
  mode,
  onBeforeInput,
  onChange,
  shouldCheck,
}: LoginIdentifierFieldProps) {
  return (
    <IdentifierCheckField
      key={mode}
      name="identifier"
      purpose="LOGIN"
      label={isMobileMode ? "Mobile Number" : "Email Address"}
      placeholder={isMobileMode ? "9876543210" : "you@example.com"}
      type={isMobileMode ? "tel" : "email"}
      autoComplete={isMobileMode ? "tel" : "email"}
      inputMode={isMobileMode ? "numeric" : "email"}
      maxLength={isMobileMode ? 10 : 254}
      pattern={isMobileMode ? "[6-9][0-9]{9}" : undefined}
      required
      leftIcon={<Icon className="h-4 w-4" />}
      clientError={error}
      inputClassName={authInputClassName}
      onBeforeInput={onBeforeInput}
      onChange={onChange}
      shouldCheck={shouldCheck}
      title={
        isMobileMode
          ? "Enter a valid 10-digit Indian mobile number"
          : "Enter a valid email address"
      }
      helperText={
        isMobileMode
          ? "Use your registered mobile number"
          : "Use your registered email address"
      }
    />
  );
}
