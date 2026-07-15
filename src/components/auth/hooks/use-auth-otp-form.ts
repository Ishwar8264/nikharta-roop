"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { getAuthErrorMessage } from "@/src/components/auth/utils/auth-flow";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/src/constants/auth";
import {
  requestAuthOtp,
  verifyAuthOtp,
} from "@/src/services/auth/auth.client";
import type {
  AuthIdentifierInput,
  AuthPurpose,
  OtpInput,
  VerifyOtpInput,
} from "@/src/types/auth";
import { otpInputSchema } from "@/src/validations/auth/auth.validation";

// Configure the identity and completion behavior needed for OTP verification.
type UseAuthOtpFormOptions = {
  deliveryMessage: string;
  identity: AuthIdentifierInput;
  onVerified: () => void;
  purpose: AuthPurpose;
};

// Encapsulate OTP validation, verification, resend, and cooldown behavior.
export function useAuthOtpForm({
  deliveryMessage,
  identity,
  onVerified,
  purpose,
}: UseAuthOtpFormOptions) {
  // Store only replacement feedback instead of copying the initial prop.
  const [resendNotice, setResendNotice] = useState("");

  // Keep verification and resend failures visible beside the OTP form.
  const [apiError, setApiError] = useState<string | null>(null);

  // Mirror the backend resend cooldown before enabling another OTP request.
  const [resendSeconds, setResendSeconds] = useState(
    OTP_RESEND_COOLDOWN_SECONDS,
  );

  // Track resend separately because React Hook Form owns verification submission.
  const [isResending, setIsResending] = useState(false);

  // Validate only the visible OTP field before building the API payload.
  const form = useForm<OtpInput>({
    resolver: zodResolver(otpInputSchema),
    defaultValues: { otp: "" },
  });

  // Count down once after every successful OTP delivery.
  useEffect(() => {
    // Keep resend available when no cooldown remains.
    if (resendSeconds <= 0) {
      return;
    }

    // Schedule one decrement so each render owns only one timer.
    const timeoutId = window.setTimeout(() => {
      // Clamp the timer at zero so the label never becomes negative.
      setResendSeconds((currentSeconds) => Math.max(currentSeconds - 1, 0));
    }, 1000);

    // Remove the pending timeout when this verification step unmounts.
    return () => window.clearTimeout(timeoutId);
  }, [resendSeconds]);

  // Verify the code against the same identity used to request it.
  const handleOtpSubmit = form.handleSubmit(async (input) => {
    // Clear stale feedback before attempting another verification.
    setApiError(null);

    // Build the complete payload expected by the shared verification schema.
    const verificationInput: VerifyOtpInput = {
      ...identity,
      otp: input.otp,
      purpose,
    };

    try {
      // Consume the OTP and establish the protected browser session.
      await verifyAuthOtp(verificationInput);

      // Complete the UI journey after the server sets authentication cookies.
      onVerified();
    } catch (error) {
      // Preserve safe backend failures or use one unknown-error fallback.
      setApiError(getAuthErrorMessage(error));
    }
  });

  // Request a replacement OTP only after the visible cooldown finishes.
  const handleResend = async () => {
    // Ignore duplicate clicks and requests made before cooldown completion.
    if (form.formState.isSubmitting || isResending || resendSeconds > 0) {
      return;
    }

    // Mark the independent resend request as pending.
    setIsResending(true);

    // Clear stale verification feedback before requesting another OTP.
    setApiError(null);

    try {
      // Reuse the normalized identity and purpose for the replacement OTP.
      const result = await requestAuthOtp(identity, purpose);

      // Show the backend-confirmed delivery message for the fresh code.
      setResendNotice(result.message);

      // Restart the UI cooldown to match the backend resend policy.
      setResendSeconds(OTP_RESEND_COOLDOWN_SECONDS);

      // Clear the old code because the backend invalidated older OTP records.
      form.reset({ otp: "" });
    } catch (error) {
      // Preserve safe backend failures or use one unknown-error fallback.
      setApiError(getAuthErrorMessage(error));
    } finally {
      // Re-enable resend controls after this request finishes.
      setIsResending(false);
    }
  };

  // Prefer fresh resend feedback while retaining initial server confirmation.
  const visibleNotice = resendNotice || deliveryMessage;

  // Default to the available action after the cooldown finishes.
  let resendLabel = "Resend OTP";

  // Prefer pending feedback while the replacement request is running.
  if (isResending) {
    resendLabel = "Sending...";
  } else if (resendSeconds > 0) {
    // Show the remaining policy-aligned delay before another request is allowed.
    resendLabel = `Resend in ${resendSeconds}s`;
  }

  // Expose focused render data while keeping side effects inside the hook.
  return {
    apiError,
    form,
    handleOtpSubmit,
    handleResend,
    isResending,
    resendLabel,
    resendSeconds,
    visibleNotice,
  };
}
