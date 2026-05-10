"use client";

import * as React from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { Button } from "@/components/ui/button";

interface VerifyOtpFormProps {
  title?: string;
  subtitle?: string;
  submitButtonLabel?: string;
  defaultMobile?: string;
  disableMobile?: boolean;
  containerClassName?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

const VerifyOtpForm = ({
  title = "Verify OTP",
  subtitle = "Enter the OTP sent to your mobile number",
  submitButtonLabel = "Verify",
  defaultMobile = "",
  disableMobile = false,
  containerClassName,
  onSubmit,
}: VerifyOtpFormProps) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
      className={containerClassName}
    >
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* ── Mobile ── */}
        <InputField
          label="Mobile Number"
          placeholder="9876543210"
          type="tel"
          autoComplete="tel"
          required
          disabled={disableMobile}
          defaultValue={defaultMobile}
          leftIcon={<Phone className="h-4 w-4" />}
          helperText="10-digit Indian mobile number"
        />

        {/* ── OTP ── */}
        <InputField
          label="OTP"
          placeholder="123456"
          type="text"
          inputMode="numeric"
          required
          leftIcon={<ShieldCheck className="h-4 w-4" />}
          helperText="6-digit one-time password"
        />

        {/* ── Submit ── */}
        <Button type="submit" className="w-full">
          {submitButtonLabel}
        </Button>

        {/* ── Resend OTP ── */}
        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Resend OTP
          </button>
        </p>
      </div>
    </form>
  );
};

VerifyOtpForm.displayName = "VerifyOtpForm";

export { VerifyOtpForm };
