"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { FormError } from "@/features/auth/shared/components/form-error";
import { OtpInput } from "@/features/auth/shared/components/otp-input";
import { PasswordField } from "@/features/auth/shared/components/password-field";
import { FIELD } from "@/features/auth/shared/constants";

import { useResetPassword } from "../hooks/use-reset-password";

/**
 * Step 2 of password reset: code + new password.
 *
 * Why email comes from the URL:
 * The forgot step already established it; asking again is a chance for a
 * typo that would surface as "Invalid code" — the exact error the user
 * cannot debug. The query param is the same email the code was sent to.
 */
export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  if (!email) return <MissingEmail />;

  return <ResetPasswordFlow />;
}

/**
 * Why a separate component:
 * Hooks cannot be called conditionally. The parent decides whether the flow
 * is possible; this child assumes a valid email and owns the state.
 */
function ResetPasswordFlow() {
  const {
    email,
    code,
    setCode,
    submit,
    resend,
    isLoading,
    isResending,
    error,
    fieldErrors,
    resendIn,
  } = useResetPassword();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await submit(String(formData.get(FIELD.newPassword) ?? ""));
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-sm space-y-5"
    >
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the code we sent to{" "}
          <span className="font-medium text-foreground">{email}</span> and
          choose a new password.
        </p>
      </header>

      <FormError>{error}</FormError>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Reset code</label>
        <OtpInput
          value={code}
          onChange={setCode}
          disabled={isLoading}
          invalid={Boolean(fieldErrors.code)}
          autoFocus
        />
        {fieldErrors.code ? (
          <p className="text-xs text-destructive">{fieldErrors.code}</p>
        ) : null}
      </div>

      <PasswordField
        id={FIELD.newPassword}
        label="New password"
        autoComplete="new-password"
        error={fieldErrors.newPassword}
        disabled={isLoading}
      />

      <Button
        type="submit"
        disabled={isLoading || code.length !== 6}
        className="w-full"
      >
        {isLoading ? "Updating password…" : "Update password"}
      </Button>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {resendIn > 0
            ? `Resend available in ${resendIn}s`
            : "Didn't get the code?"}
        </span>
        <button
          type="button"
          onClick={() => void resend()}
          disabled={isResending || resendIn > 0}
          className="font-medium text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isResending ? "Sending…" : "Resend code"}
        </button>
      </div>
    </form>
  );
}

/** Fallback when the URL does not carry an email. */
function MissingEmail() {
  return (
    <div className="w-full max-w-sm space-y-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Start the reset flow to receive a code.
        </p>
      </header>

      <Button
        render={<Link href={routes.forgotPassword} />}
        nativeButton={false}
        className="w-full"
      >
        Start password reset
      </Button>
    </div>
  );
}
