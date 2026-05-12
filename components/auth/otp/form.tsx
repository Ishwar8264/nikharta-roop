"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck } from "lucide-react";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { Button } from "@/components/ui/button";
import {
  showError,
  showSuccess,
} from "@/components/ui/shared/toast/custom-toast";
import {
  verifySigninAction,
  verifySignupAction,
} from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";

interface VerifyOtpFormProps {
  title?: string;
  subtitle?: string;
  submitButtonLabel?: string;
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
  defaultMobile = "",
  devOtp,
  disableMobile = false,
  containerClassName,
  mode,
}: VerifyOtpFormProps) => {
  const router = useRouter();
  const [state, setState] = React.useState<AuthActionState | null>(null);
  const [isPending, startTransition] = React.useTransition();

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

  return (
    <form
      onSubmit={handleSubmit}
      className={containerClassName}
    >
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* ── Mobile ── */}
        {/* Disabled inputs are not submitted by browsers, so a hidden input
            carries the mobile value when the visible field is locked. */}
        {disableMobile ? (
          <input type="hidden" name="mobile" value={defaultMobile} />
        ) : null}
        <InputField
          name={disableMobile ? undefined : "mobile"}
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
          name="otp"
          label="OTP"
          placeholder="123456"
          type="text"
          inputMode="numeric"
          required
          leftIcon={<ShieldCheck className="h-4 w-4" />}
          helperText="6-digit one-time password"
        />

        {/* Local development only: handlers omit devOtp in production, so this
            helper never appears for real users. */}
        {devOtp ? (
          <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            Dev OTP: {devOtp}
          </p>
        ) : null}

        {state && !state.success ? (
          <p className="text-sm text-destructive">{state.message}</p>
        ) : null}

        {/* ── Submit ── */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Verifying..." : submitButtonLabel}
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
