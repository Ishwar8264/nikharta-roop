"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MailCheck, Send, LockKeyhole } from "lucide-react";

import { PasswordField } from "@/features/auth/shared/components/password-field";
import { Field } from "@/features/auth/shared/components/field";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

import { FormError } from "@/features/auth/shared/components/form-error";
import { useVerifyOtp } from "../hooks/useVerifyOtp";
import { OtpInput } from "../../shared/otpInput";

/** Reuses the account verification flow for registration and salon membership invitations. */
export function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  if (!email) {
    return <MissingEmail />;
  }

  return <VerifyOtpFlow key={email} email={email} setup={searchParams.get("setup") === "1"} codeAlreadySent={searchParams.get("sent") === "1"} staffActivation={searchParams.get("flow") === "staff"} />;
}

/**
 * Why a separate component:
 * Hooks cannot be called conditionally. The parent decides whether the flow
 * is even possible; this child assumes a valid email and owns the state.
 */
function VerifyOtpFlow({ email, setup, codeAlreadySent, staffActivation }: { email: string; setup: boolean; codeAlreadySent: boolean; staffActivation: boolean }) {
  const {
    step,
    signInUrl,
    code,
    setCode,
    newPassword,
    setNewPassword,
    needsPassword,
    sendCode,
    verifyCode,
    isSending,
    isVerifying,
    error,
    resendIn,
  } = useVerifyOtp(email, setup, codeAlreadySent, staffActivation);

  if (step === "complete") {
    return (
      <div className="w-full space-y-3 text-center" role="status">
        <MailCheck className="mx-auto size-10 text-success" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Email verified</h1>
        <p className="text-sm text-muted-foreground">Your salon account is ready.</p>
        <Button render={<Link href={signInUrl} />}>Sign in</Button>
      </div>
    );
  }

  const isCodeSent = step === "verify";

  return (
    <div className="w-full min-w-0 max-w-sm space-y-6">
      <header className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center border border-primary/25 bg-primary/10 text-primary"
        >
          <MailCheck className="size-5" />
        </div>

        <div className="min-w-0 space-y-2">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              {isCodeSent ? "Check your inbox" : "Verify your email"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isCodeSent
                ? "Enter the 6-digit code sent to:"
                : "We'll send a 6-digit verification code to:"}
            </p>
          </div>

          <p className="break-all border-l-2 border-primary pl-2 font-medium text-foreground">
            {email}
          </p>
        </div>
      </header>

      <FormError>{error}</FormError>

      {step === "send" ? (
        <Button
          type="button"
          onClick={() => void sendCode()}
          disabled={isSending}
          className="w-full"
        >
          <Send data-icon="inline-start" />
          {isSending ? "Sending code…" : "Send verification code"}
        </Button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verifyCode();
          }}
          className="space-y-4"
        >
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={isVerifying}
            autoFocus
          />

          {needsPassword ? <PasswordField id="setup-password" label="Create your password" placeholder="Create a strong password" icon={<LockKeyhole className="size-4" />} autoComplete="new-password" minLength={8} maxLength={128} required disabled={isVerifying} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /> : null}

          <Button
            type="submit"
            disabled={isVerifying || code.length !== 6}
            className="w-full"
          >
            {isVerifying ? "Verifying…" : "Verify email"}
          </Button>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span role="status" aria-atomic="true">
              {resendIn > 0
                ? `Resend available in ${resendIn}s`
                : "Didn't get the code?"}
            </span>
            <button
              type="button"
              onClick={() => void sendCode()}
              disabled={isSending || resendIn > 0}
              className="font-medium text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? "Sending…" : "Resend"}
            </button>
          </div>
        </form>
      )}

      {!staffActivation ? <div className="border-t border-border pt-4 text-center">
        <Link
          href={routes.login}
          className="inline-flex min-h-6 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Wrong email? Back to sign in
        </Link>
      </div> : null}
    </div>
  );
}

/** Fallback when the URL does not carry an email. */
function MissingEmail() {
  return (
    <div className="w-full max-w-sm space-y-5">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Verify your email
        </h1>
        <p className="text-sm text-muted-foreground">Enter the email linked to your account.</p>
      </header>
      <form action={routes.verifyOtp} method="get" className="space-y-4">
        <Field id="verification-email" name="email" label="Email address" type="email" autoComplete="email" maxLength={254} required />
        <Button type="submit" className="w-full">Continue</Button>
      </form>
    </div>
  );
}
