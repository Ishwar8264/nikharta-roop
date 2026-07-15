"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { OTP_RESEND_COOLDOWN_SECONDS } from "@/src/constants/auth";
import { ApiClientError } from "@/src/lib/api-client";
import {
  registerUser,
  verifySignupOtp,
} from "@/src/services/auth/auth.client";
import type {
  OtpInput,
  RegisterInput,
  VerifyOtpInput,
} from "@/src/types/auth";
import { otpInputSchema } from "@/src/validations/auth/auth.validation";

// Receive the normalized identity and registration flow callbacks.
type RegisterOtpStepProps = {
  deliveryMessage: string;
  identity: RegisterInput;
  onChangeIdentity: () => void;
  onVerified: () => void;
};

// Verify the signup OTP and control resend behavior within backend limits.
export function RegisterOtpStep({
  deliveryMessage,
  identity,
  onChangeIdentity,
  onVerified,
}: RegisterOtpStepProps) {
  // Store only replacement delivery feedback instead of copying the initial prop.
  const [resendNotice, setResendNotice] = useState("");

  // Keep verification and resend failures visible beside the OTP form.
  const [apiError, setApiError] = useState<string | null>(null);

  // Mirror the backend resend cooldown before enabling another OTP request.
  const [resendSeconds, setResendSeconds] = useState(
    OTP_RESEND_COOLDOWN_SECONDS,
  );

  // Track resend separately because React Hook Form owns verification submission.
  const [isResending, setIsResending] = useState(false);

  // Validate only the visible OTP field before building the complete API payload.
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<OtpInput>({
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
  const handleVerify = async (input: OtpInput) => {
    // Clear stale feedback before attempting another verification.
    setApiError(null);

    // Build the exact SIGNUP payload expected by the shared API schema.
    const verificationInput: VerifyOtpInput = {
      ...identity,
      otp: input.otp,
      purpose: "SIGNUP",
    };

    try {
      // Consume the OTP and establish the protected browser session.
      await verifySignupOtp(verificationInput);

      // Complete registration after cookies establish the authenticated session.
      onVerified();
    } catch (error) {
      // Preserve expected backend verification failures for correction.
      if (error instanceof ApiClientError) {
        setApiError(error.message);

        // Stop before applying the unknown-error fallback.
        return;
      }

      // Hide unexpected implementation details behind one safe message.
      setApiError("Something went wrong. Please try again.");
    }
  };

  // Request a replacement OTP only after the visible cooldown finishes.
  const handleResend = async () => {
    // Ignore duplicate clicks and requests made before cooldown completion.
    if (isSubmitting || isResending || resendSeconds > 0) {
      return;
    }

    // Mark the independent resend request as pending.
    setIsResending(true);

    // Clear stale verification feedback before requesting another OTP.
    setApiError(null);

    try {
      // Reuse the normalized registration identity for the replacement OTP.
      const result = await registerUser(identity);

      // Show the backend-confirmed delivery message for the fresh code.
      setResendNotice(result.message);

      // Restart the UI cooldown to match the backend resend policy.
      setResendSeconds(OTP_RESEND_COOLDOWN_SECONDS);

      // Clear the previous code because the backend invalidated older OTP records.
      reset({ otp: "" });
    } catch (error) {
      // Preserve expected cooldown, provider, and network messages.
      if (error instanceof ApiClientError) {
        setApiError(error.message);

        // Stop before applying the unknown-error fallback.
        return;
      }

      // Hide unexpected implementation details behind one safe message.
      setApiError("Something went wrong. Please try again.");
    } finally {
      // Re-enable resend controls after this request finishes.
      setIsResending(false);
    }
  };

  // Show the normalized destination without exposing unrelated account data.
  const destination = identity.email ?? identity.mobile ?? "your identity";

  // Prefer fresh resend feedback while deriving the initial message from props.
  const visibleNotice = resendNotice || deliveryMessage;

  // Describe only the identity channel currently being verified.
  const changeIdentityLabel = identity.email ? "Change email" : "Change mobile";

  // Default to the available action after the cooldown finishes.
  let resendLabel = "Resend OTP";

  // Prefer pending feedback while the replacement request is running.
  if (isResending) {
    resendLabel = "Sending...";
  } else if (resendSeconds > 0) {
    // Show the remaining policy-aligned delay before another request is allowed.
    resendLabel = `Resend in ${resendSeconds}s`;
  }

  // Render one focused verification step after OTP delivery succeeds.
  return (
    <section aria-labelledby="verify-otp-heading">
      {/* Let the customer correct a mistyped identity before verification. */}
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || isResending}
        onClick={onChangeIdentity}
        type="button"
      >
        {/* Communicate backwards navigation without relying on text direction. */}
        <ArrowLeft aria-hidden="true" className="size-4" />
        {changeIdentityLabel}
      </button>

      {/* Explain where the short-lived verification code was delivered. */}
      <div className="mt-6 text-center">
        {/* Give the OTP step a clear and direct heading. */}
        <h1
          className="font-display text-3xl font-semibold tracking-[-0.025em]"
          id="verify-otp-heading"
        >
          Verify your code
        </h1>

        {/* Keep the destination visible so mistakes are easy to identify. */}
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Enter the six-digit code sent to <strong>{destination}</strong>.
        </p>
      </div>

      {/* Confirm that the initial or replacement OTP was delivered. */}
      {visibleNotice ? (
        <div
          aria-live="polite"
          className="mt-6 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          {/* Distinguish successful delivery from validation or API errors. */}
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          {/* Preserve the backend-confirmed delivery message exactly. */}
          <span>{visibleNotice}</span>
        </div>
      ) : null}

      {/* Validate the OTP locally before consuming it on the server. */}
      <form
        className="mt-6 space-y-5"
        onSubmit={handleSubmit(handleVerify)}
        noValidate
      >
        {/* Keep the OTP label, input, and validation message together. */}
        <div>
          {/* Describe the exact one-time code expected by the input. */}
          <label className="text-sm font-semibold" htmlFor="signup-otp">
            Verification code
          </label>

          {/* Accept numeric OTP entry while preserving leading zeroes as text. */}
          <input
            aria-describedby={errors.otp ? "signup-otp-error" : undefined}
            aria-invalid={Boolean(errors.otp)}
            autoComplete="one-time-code"
            className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-center font-mono text-xl tracking-[0.35em] outline-none transition placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/30"
            id="signup-otp"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            type="text"
            {...register("otp")}
          />

          {/* Show the shared OTP validation rule beside invalid input. */}
          {errors.otp ? (
            <p className="mt-2 text-sm text-destructive" id="signup-otp-error">
              {errors.otp.message}
            </p>
          ) : null}
        </div>

        {/* Announce backend errors without replacing their useful original message. */}
        {apiError ? (
          <div
            aria-live="polite"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {apiError}
          </div>
        ) : null}

        {/* Submit the code once while clearly communicating verification progress. */}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || isResending}
          type="submit"
        >
          {/* Show activity only while the verification request is pending. */}
          {isSubmitting ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}

          {/* Keep request progress understandable without relying on the icon. */}
          {isSubmitting ? "Verifying..." : "Verify and create account"}
        </button>
      </form>

      {/* Offer a replacement code only after the backend cooldown expires. */}
      <div className="mt-5 text-center text-sm text-muted-foreground">
        Didn&apos;t receive the code?{" "}
        {/* Prevent resend requests that the backend would intentionally reject. */}
        <button
          className="font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          disabled={isSubmitting || isResending || resendSeconds > 0}
          onClick={handleResend}
          type="button"
        >
          {/* Show request progress, countdown, or the available resend action. */}
          {resendLabel}
        </button>
      </div>
    </section>
  );
}
