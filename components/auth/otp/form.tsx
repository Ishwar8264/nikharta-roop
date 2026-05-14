"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AtSign, ShieldCheck } from "lucide-react";
import {
  AuthFormHeader,
  authButtonClassName,
  authFormClassName,
  authInputClassName,
} from "@/components/auth/auth-ui";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { Button } from "@/components/ui/button";
import {
  showError,
  showSuccess,
} from "@/components/ui/shared/toast/custom-toast";
import {
  resendOtpAction,
  verifySigninAction,
  verifySignupAction,
} from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";
import { cn } from "@/lib/utils";

interface VerifyOtpFormProps {
  title?: string;
  subtitle?: string;
  submitButtonLabel?: string;
  defaultIdentifier?: string;
  defaultMobile?: string;
  devOtp?: string;
  disableMobile?: boolean;
  containerClassName?: string;
  mode: "signin" | "signup";
}

const VerifyOtpForm = ({
  title = "Verify OTP",
  subtitle = "Enter the OTP sent to your mobile number",
  submitButtonLabel = "Verify",
  defaultIdentifier,
  defaultMobile = "",
  devOtp,
  disableMobile = false,
  containerClassName,
  mode,
}: VerifyOtpFormProps) => {
  const router = useRouter();
  const [state, setState] = React.useState<AuthActionState | null>(null);
  const [resendState, setResendState] = React.useState<AuthActionState | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isResending, startResendTransition] = React.useTransition();
  const identifierValue = defaultIdentifier || defaultMobile;
  const identifierFieldName = mode === "signin" ? "identifier" : "mobile";
  const purpose = mode === "signin" ? "LOGIN" : "SIGNUP";

  // The same OTP component serves signin and signup. Mode picks the correct
  // Server Action while keeping the UI reusable.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const action = mode === "signin" ? verifySigninAction : verifySignupAction;

    startTransition(async () => {
      const result = await action(formData);
      setState(result);

      if (result.success) {
        showSuccess("Verification complete", result.message);
      } else {
        showError("Verification failed", result.message);
      }

      // On success the action has already set HttpOnly cookies server-side.
      // The client only navigates to the returned route.
      if (result.success && result.data?.redirectTo) {
        router.push(result.data.redirectTo);
      }
    });
  }

  function handleResend(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;

    if (!form) {
      return;
    }

    const formData = new FormData(form);
    formData.set("purpose", purpose);

    startResendTransition(async () => {
      const result = await resendOtpAction(formData);
      setResendState(result);

      if (result.success) {
        showSuccess("OTP resent", result.message);
      } else {
        showError("Resend failed", result.message);
      }

      if (result.success && result.data?.redirectTo) {
        router.replace(result.data.redirectTo);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(authFormClassName, containerClassName)}
    >
      <AuthFormHeader title={title} subtitle={subtitle} />

      <div className="mt-7 space-y-5">
        <input type="hidden" name="purpose" value={purpose} />

        {disableMobile ? (
          <input type="hidden" name={identifierFieldName} value={identifierValue} />
        ) : null}
        <InputField
          name={disableMobile ? undefined : identifierFieldName}
          label={mode === "signin" ? "Mobile Number or Email" : "Mobile Number"}
          placeholder={mode === "signin" ? "9876543210 or you@example.com" : "9876543210"}
          type="text"
          autoComplete="one-time-code"
          required
          disabled={disableMobile}
          defaultValue={identifierValue}
          leftIcon={<AtSign className="h-4 w-4" />}
          inputClassName={authInputClassName}
          helperText={
            mode === "signin"
              ? "Registered mobile number or email"
              : "10-digit Indian mobile number"
          }
        />

        <InputField
          name="otp"
          label="OTP"
          placeholder="123456"
          type="text"
          inputMode="numeric"
          required
          leftIcon={<ShieldCheck className="h-4 w-4" />}
          inputClassName={authInputClassName}
          helperText="6-digit one-time password"
        />

        {devOtp ? (
          <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            Dev OTP: {devOtp}
          </p>
        ) : null}

        {state && !state.success ? (
          <p className="text-sm text-destructive">{state.message}</p>
        ) : null}
        {resendState && !resendState.success ? (
          <p className="text-sm text-destructive">{resendState.message}</p>
        ) : null}

        <Button
          type="submit"
          className={`w-full ${authButtonClassName}`}
          disabled={isPending}
        >
          {isPending ? "Verifying..." : submitButtonLabel}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            disabled={isResending}
            onClick={handleResend}
          >
            {isResending ? "Resending..." : "Resend OTP"}
          </button>
        </p>
      </div>
    </form>
  );
};

VerifyOtpForm.displayName = "VerifyOtpForm";

export { VerifyOtpForm };
