"use client";

import * as React from "react";
import { Mail, Phone, User } from "lucide-react";

import {
  authInputClassName,
} from "@/components/auth/auth-ui";
import { IdentifierCheckField } from "@/components/auth/identifier-check-field";
import { InputField } from "@/components/ui/shared/input/generic-input";

type RegisterFieldsProps = {
  emailError?: string;
  mobileError?: string;
  onEmailChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMobileBeforeInput: (event: React.FormEvent<HTMLInputElement>) => void;
  onMobileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  shouldCheckEmail: (value: string) => boolean;
  shouldCheckMobile: (value: string) => boolean;
};

// Groups signup inputs only; validation and server checks stay in the hook.
export function RegisterFields({
  emailError,
  mobileError,
  onEmailChange,
  onMobileBeforeInput,
  onMobileChange,
  shouldCheckEmail,
  shouldCheckMobile,
}: RegisterFieldsProps) {
  return (
    <>
      <InputField
        name="name"
        label="Name"
        placeholder="Enter your name"
        type="text"
        autoComplete="name"
        leftIcon={<User className="h-4 w-4" />}
        inputClassName={authInputClassName}
        helperText="2-100 characters"
      />

      <IdentifierCheckField
        name="email"
        purpose="SIGNUP"
        label="Email"
        placeholder="you@example.com"
        type="email"
        autoComplete="email"
        leftIcon={<Mail className="h-4 w-4" />}
        clientError={emailError}
        inputClassName={authInputClassName}
        onChange={onEmailChange}
        shouldCheck={shouldCheckEmail}
        helperText="Optional, but we'll send updates here"
        title="Enter a valid email address"
      />

      <IdentifierCheckField
        name="mobile"
        purpose="SIGNUP"
        label="Mobile Number"
        placeholder="9876543210"
        type="tel"
        autoComplete="tel"
        inputMode="numeric"
        maxLength={10}
        pattern="[6-9][0-9]{9}"
        required
        leftIcon={<Phone className="h-4 w-4" />}
        clientError={mobileError}
        inputClassName={authInputClassName}
        onBeforeInput={onMobileBeforeInput}
        onChange={onMobileChange}
        shouldCheck={shouldCheckMobile}
        helperText="10-digit Indian mobile number"
        title="Enter a valid 10-digit Indian mobile number"
      />
    </>
  );
}
