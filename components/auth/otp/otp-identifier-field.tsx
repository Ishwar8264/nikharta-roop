"use client";

import { Mail, Phone } from "lucide-react";

import {
  authInputClassName,
} from "@/components/auth/auth-ui";
import { InputField } from "@/components/ui/shared/input/generic-input";

type OtpIdentifierFieldProps = {
  defaultValue: string;
  disabled?: boolean;
  fieldName?: string;
  isEmail: boolean;
  mode: "signin" | "signup";
};

// Shows the same identifier used to request OTP, with matching phone/email icon.
export function OtpIdentifierField({
  defaultValue,
  disabled,
  fieldName,
  isEmail,
  mode,
}: OtpIdentifierFieldProps) {
  const Icon = isEmail ? Mail : Phone;
  const isSigninEmail = mode === "signin" && isEmail;

  return (
    <InputField
      name={disabled ? undefined : fieldName}
      label={isSigninEmail ? "Email Address" : "Mobile Number"}
      placeholder={isSigninEmail ? "you@example.com" : "9876543210"}
      type="text"
      autoComplete="one-time-code"
      required
      disabled={disabled}
      defaultValue={defaultValue}
      leftIcon={<Icon className="h-4 w-4" />}
      inputClassName={authInputClassName}
      helperText={
        isSigninEmail ? "Registered email address" : "Registered mobile number"
      }
    />
  );
}
