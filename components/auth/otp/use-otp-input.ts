"use client";

import * as React from "react";

import {
  getOtpError,
  isNonDigitInput,
  sanitizeDigits,
} from "@/components/auth/utils/auth-form-validation";

// Keeps OTP behavior reusable between signin and signup verification screens.
export function useOtpInput(onValidInputChange: () => void) {
  const [otpError, setOtpError] = React.useState<string | null>(null);

  // Submit path needs a hard error, even when the field was untouched.
  function validateOtp(value: string) {
    const error = getOtpError(value);

    if (error) {
      setOtpError(error);
      return error;
    }

    return null;
  }

  // Paste and autocomplete are sanitized to exactly six numeric characters.
  function handleOtpChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = sanitizeDigits(event.currentTarget.value, 6);

    event.currentTarget.value = nextValue;
    setOtpError(nextValue ? getOtpError(nextValue) : null);
    onValidInputChange();
  }

  // Typed non-digits are blocked before they flash in the field.
  function handleOtpBeforeInput(event: React.FormEvent<HTMLInputElement>) {
    if (isNonDigitInput(event)) {
      event.preventDefault();
    }
  }

  return {
    handleOtpBeforeInput,
    handleOtpChange,
    otpError,
    validateOtp,
  };
}
