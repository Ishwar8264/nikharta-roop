/**
 * Purpose: OTP code input for signin and signup verification screens.
 * Responsibilities: enforce numeric OTP input attributes and shared auth styling.
 * Important notes: validation stays parent-owned so server errors can be displayed inline.
 */
"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";

import {
  authInputClassName,
} from "@/components/auth/auth-ui";
import { InputField } from "@/components/ui/shared/input/generic-input";

type OtpCodeFieldProps = {
  error?: string;
  onBeforeInput: (event: React.FormEvent<HTMLInputElement>) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Renders the six-digit OTP input with a verification icon.
 */
export function OtpCodeField({
  error,
  onBeforeInput,
  onChange,
}: OtpCodeFieldProps) {
  return (
    <InputField
      name="otp"
      label="OTP"
      placeholder="123456"
      type="text"
      inputMode="numeric"
      maxLength={6}
      pattern="[0-9]{6}"
      required
      leftIcon={<ShieldCheck className="size-4" />}
      inputClassName={authInputClassName}
      error={error}
      helperText="6-digit one-time password"
      onBeforeInput={onBeforeInput}
      onChange={onChange}
      title="Enter a valid 6-digit OTP"
    />
  );
}
