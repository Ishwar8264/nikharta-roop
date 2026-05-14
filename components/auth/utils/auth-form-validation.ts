import type * as React from "react";

export type IdentifierMode = "mobile" | "email";

// Auth accepts only these stable formats before server actions run.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;
const OTP_PATTERN = /^\d{6}$/;

// Email fields should never carry pasted spaces into validation/API calls.
export function sanitizeEmail(value: string) {
  return value.replace(/\s/g, "");
}

// Shared digit sanitizer keeps mobile and OTP inputs strict on paste too.
export function sanitizeDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

// Blocks single invalid keystrokes before they touch numeric-only fields.
export function isNonDigitInput(event: React.FormEvent<HTMLInputElement>) {
  const inputEvent = event.nativeEvent as InputEvent;

  return Boolean(inputEvent.data && /\D/.test(inputEvent.data));
}

// Live login validation stays nullable so empty fields do not show early errors.
export function getLoginIdentifierError(value: string, mode: IdentifierMode) {
  if (!value) {
    return null;
  }

  if (mode === "mobile") {
    return INDIAN_MOBILE_PATTERN.test(value)
      ? null
      : "Enter a valid 10-digit Indian mobile number";
  }

  return EMAIL_PATTERN.test(value) ? null : "Enter a valid email address";
}

// Submit validation is stricter because the user has already requested action.
export function getLoginIdentifierSubmitError(
  value: string,
  mode: IdentifierMode,
) {
  if (!value) {
    return mode === "mobile"
      ? "Enter your mobile number"
      : "Enter your email address";
  }

  return getLoginIdentifierError(value, mode);
}

// Signup email is optional, but when present it must be syntactically valid.
export function getOptionalEmailError(value: string) {
  if (!value) {
    return null;
  }

  return EMAIL_PATTERN.test(value) ? null : "Enter a valid email address";
}

// Mobile is the required signup/login anchor for Indian customers.
export function getRequiredMobileError(value: string) {
  if (!value) {
    return "Enter your mobile number";
  }

  return INDIAN_MOBILE_PATTERN.test(value)
    ? null
    : "Enter a valid 10-digit Indian mobile number";
}

// OTP verification must remain exactly six digits before hitting the server.
export function getOtpError(value: string) {
  if (!value) {
    return "Enter the OTP";
  }

  return OTP_PATTERN.test(value) ? null : "Enter a valid 6-digit OTP";
}
