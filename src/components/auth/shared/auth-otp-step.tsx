import { ArrowLeft, LoaderCircle } from "lucide-react";

import { useAuthOtpForm } from "@/src/components/auth/hooks/use-auth-otp-form";
import { AuthFormField } from "@/src/components/auth/shared/auth-form-field";
import type { AuthFlowCopy } from "@/src/components/auth/utils/auth-flow";
import { Button } from "@/src/components/ui/button";
import type { AuthIdentifierInput, AuthPurpose } from "@/src/types/auth";

// Configure the identity, purpose, and transitions required by verification.
type AuthOtpStepProps = {
  copy: AuthFlowCopy;
  identity: AuthIdentifierInput;
  onChangeIdentity: () => void;
  onVerified: () => void;
  purpose: AuthPurpose;
};

// Render one reusable OTP step for both login and account registration.
export function AuthOtpStep({
  copy,
  identity,
  onChangeIdentity,
  onVerified,
  purpose,
}: AuthOtpStepProps) {
  // Keep verification, resend, and cooldown behavior inside the dedicated hook.
  const {
    form,
    handleOtpSubmit,
    handleResend,
    isResending,
    resendLabel,
    resendSeconds,
  } = useAuthOtpForm({ identity, onVerified, purpose });

  // Show the normalized destination without exposing unrelated account data.
  const destination = identity.email ?? identity.mobile ?? "your identity";

  // Describe only the identity channel currently being verified.
  const changeIdentityLabel = identity.email ? "Change email" : "Change mobile";

  // Disable every competing action while verification or resend is pending.
  const isBusy = form.formState.isSubmitting || isResending;

  // Render the interactive verification state after successful OTP delivery.
  return (
    <section aria-labelledby="verify-otp-heading">
      {/* Let the customer correct a mistyped identity before verification. */}
      <Button
        disabled={isBusy}
        onClick={onChangeIdentity}
        size="sm"
        type="button"
        variant="ghost"
      >
        {/* Communicate backwards navigation without relying on text direction. */}
        <ArrowLeft aria-hidden="true" />
        {changeIdentityLabel}
      </Button>

      {/* Explain where the short-lived verification code was delivered. */}
      <div className="mt-6 text-center">
        {/* Give the OTP step a clear and direct heading. */}
        <h1
          className="font-display text-3xl font-semibold tracking-tight"
          id="verify-otp-heading"
        >
          Verify your code
        </h1>

        {/* Keep the destination visible so mistakes are easy to identify. */}
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Enter the six-digit code sent to <strong>{destination}</strong>.
        </p>
      </div>

      {/* Validate the OTP locally before consuming it on the server. */}
      <form className="mt-6 space-y-5" noValidate onSubmit={handleOtpSubmit}>
        {/* Accept numeric OTP entry while preserving leading zeroes as text. */}
        <AuthFormField
          autoComplete="one-time-code"
          className="text-center font-mono text-xl tracking-[0.35em]"
          error={form.formState.errors.otp?.message}
          id={`${purpose.toLowerCase()}-otp`}
          inputMode="numeric"
          label="Verification code"
          maxLength={6}
          placeholder="000000"
          type="text"
          {...form.register("otp")}
        />

        {/* Submit the code once while communicating verification progress. */}
        <Button className="w-full" disabled={isBusy} size="lg" type="submit">
          {/* Show activity only while the verification request is pending. */}
          {form.formState.isSubmitting ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : null}

          {/* Keep request progress understandable without relying on the icon. */}
          {form.formState.isSubmitting ? "Verifying..." : copy.verifyLabel}
        </Button>
      </form>

      {/* Offer a replacement code only after the backend cooldown expires. */}
      <div className="mt-5 text-center text-sm text-muted-foreground">
        Didn&apos;t receive the code?{" "}
        {/* Prevent resend requests that the backend would intentionally reject. */}
        <Button
          className="h-auto p-0 align-baseline"
          disabled={isBusy || resendSeconds > 0}
          onClick={handleResend}
          type="button"
          variant="link"
        >
          {/* Show request progress, countdown, or the available resend action. */}
          {resendLabel}
        </Button>
      </div>
    </section>
  );
}
