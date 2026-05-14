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

// Small OTP input wrapper keeps verification screens visually consistent.
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
      leftIcon={<ShieldCheck className="h-4 w-4" />}
      inputClassName={authInputClassName}
      error={error}
      helperText="6-digit one-time password"
      onBeforeInput={onBeforeInput}
      onChange={onChange}
      title="Enter a valid 6-digit OTP"
    />
  );
}
