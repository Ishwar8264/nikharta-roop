"use client";

import { AuthFormHeader, authButtonClassName, authFormClassName } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OtpCodeField } from "./otp-code-field";
import { OtpIdentifierField } from "./otp-identifier-field";
import { ResendOtpControl } from "./resend-otp-control";
import { useVerifyOtpForm } from "./use-verify-otp-form";

interface VerifyOtpFormProps {
  containerClassName?: string;
  defaultIdentifier?: string;
  defaultMobile?: string;
  devOtp?: string;
  disableMobile?: boolean;
  initialRetryAfter?: number;
  mode: "signin" | "signup";
  submitButtonLabel?: string;
  subtitle?: string;
  title?: string;
}

const VerifyOtpForm = ({
  title = "Verify OTP",
  subtitle = "Enter the OTP sent to your mobile number",
  submitButtonLabel = "Verify",
  defaultIdentifier,
  defaultMobile = "",
  devOtp,
  disableMobile = false,
  initialRetryAfter = 0,
  containerClassName,
  mode,
}: VerifyOtpFormProps) => {
  const purpose = mode === "signin" ? "LOGIN" : "SIGNUP";
  const identifierValue = defaultIdentifier || defaultMobile;
  const identifierFieldName = mode === "signin" ? "identifier" : "mobile";
  const form = useVerifyOtpForm({ initialRetryAfter, mode, purpose });

  return (
    <form onSubmit={form.handleSubmit} className={cn(authFormClassName, containerClassName)}>
      <AuthFormHeader title={title} subtitle={subtitle} />

      <div className="mt-7 space-y-5">
        <input type="hidden" name="purpose" value={purpose} />

        {disableMobile ? <input type="hidden" name={identifierFieldName} value={identifierValue} /> : null}
        {/* Locked field mirrors the identifier chosen in the previous step. */}
        <OtpIdentifierField
          defaultValue={identifierValue}
          disabled={disableMobile}
          fieldName={identifierFieldName}
          isEmail={identifierValue.includes("@")}
          mode={mode}
        />

        <OtpCodeField
          error={form.otpError ?? undefined}
          onBeforeInput={form.handleOtpBeforeInput}
          onChange={form.handleOtpChange}
        />

        {devOtp ? (
          <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            Dev OTP: {devOtp}
          </p>
        ) : null}

        {form.state && !form.state.success ? (
          <p className="text-sm text-destructive">{form.state.message}</p>
        ) : null}
        {form.resendState && !form.resendState.success
          ? <p className="text-sm text-destructive">{form.resendState.message}</p>
          : null}

        <Button
          type="submit"
          className={`w-full ${authButtonClassName}`}
          disabled={form.isPending}
        >
          {form.isPending ? "Verifying..." : submitButtonLabel}
        </Button>

        <ResendOtpControl
          canResend={form.canResendOtp}
          cooldown={form.cooldown}
          isResending={form.isResending}
          onResend={form.handleResend}
        />
      </div>
    </form>
  );
};

VerifyOtpForm.displayName = "VerifyOtpForm";

export { VerifyOtpForm };
