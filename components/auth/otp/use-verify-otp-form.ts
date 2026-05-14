"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { resendOtpAction, verifySigninAction, verifySignupAction } from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";
import { showError, showSuccess } from "@/components/ui/shared/toast/custom-toast";
import { useOtpInput } from "./use-otp-input";
import { useResendCooldown } from "./use-resend-cooldown";
type UseVerifyOtpFormInput = {
  initialRetryAfter: number;
  mode: "signin" | "signup";
  purpose: "LOGIN" | "SIGNUP";
};

// Coordinates OTP verify/resend flows without leaking action logic into UI.
export function useVerifyOtpForm({
  initialRetryAfter,
  mode,
  purpose,
}: UseVerifyOtpFormInput) {
  const router = useRouter();
  const [state, setState] = React.useState<AuthActionState | null>(null);
  const [resendState, setResendState] =
    React.useState<AuthActionState | null>(null);
  const { cooldown, setCooldown } = useResendCooldown(initialRetryAfter);
  const otpInput = useOtpInput(() => setState(null));
  const [isPending, startTransition] = React.useTransition();
  const [isResending, startResendTransition] = React.useTransition();
  const canResendOtp = cooldown <= 0 && !isResending;
  const action = mode === "signin" ? verifySigninAction : verifySignupAction;
  // Verify uses the form payload from the page, with OTP normalized first.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const otp = String(formData.get("otp") ?? "").trim();
    const validationError = otpInput.validateOtp(otp);

    if (validationError) {
      showError("Verification failed", validationError);
      return;
    }

    formData.set("otp", otp);
    startTransition(async () => {
      const result = await action(formData);
      setState(result);
      if (result.success) {
        showSuccess("Verification complete", result.message);
      } else {
        showError("Verification failed", result.message);
      }

      if (result.success && result.data?.redirectTo) {
        router.push(result.data.redirectTo);
      }
    });
  }
  // Resend reuses hidden identifier fields and restarts cooldown from API.
  function handleResend(event: React.MouseEvent<HTMLButtonElement>) {
    if (!canResendOtp || !event.currentTarget.form) {
      return;
    }

    const formData = new FormData(event.currentTarget.form);
    formData.set("purpose", purpose);

    startResendTransition(async () => {
      const result = await resendOtpAction(formData);
      setResendState(result);
      if (result.success) {
        showSuccess("OTP resent", result.message);
      } else {
        showError("Resend failed", result.message);
      }

      if (result.data?.retryAfter) {
        setCooldown(result.data.retryAfter);
      }

      if (result.success && result.data?.redirectTo) {
        router.replace(result.data.redirectTo);
      }
    });
  }
  return {
    canResendOtp,
    cooldown,
    handleOtpBeforeInput: otpInput.handleOtpBeforeInput,
    handleOtpChange: otpInput.handleOtpChange,
    handleResend,
    handleSubmit,
    isPending,
    isResending,
    otpError: otpInput.otpError,
    resendState,
    state,
  };
}
