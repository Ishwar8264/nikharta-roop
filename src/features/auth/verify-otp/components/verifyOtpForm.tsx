"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, MailCheck, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

import { FormError } from "@/features/auth/shared/components/form-error";
import { useVerifyOtp } from "../hooks/useVerifyOtp";
import { OtpInput } from "../../shared/otpInput";

/**
 * Two-step email verification form.
 *
 * Why email comes from the URL, not a form field:
 * The register flow already established the email; asking again would be a
 * chance for typos and a way to probe other accounts. The query param keeps
 * the page a pure consumer of an already-known fact.
 *
 * Why a missing email renders a fallback instead of a redirect:
 * A redirect would break browser Back after verify, and any link that drops
 * the query. The fallback ("go to login / register") is friendlier and keeps
 * the page stateless.
 */
export function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  if (!email) {
    return <MissingEmail />;
  }

  return <VerifyOtpFlow email={email} />;
}

/**
 * Why a separate component:
 * Hooks cannot be called conditionally. The parent decides whether the flow
 * is even possible; this child assumes a valid email and owns the state.
 */
function VerifyOtpFlow({ email }: { email: string }) {
  const {
    step,
    code,
    setCode,
    sendCode,
    verifyCode,
    isSending,
    isVerifying,
    error,
    resendIn,
  } = useVerifyOtp(email);

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

      <div className="border-t border-border pt-4 text-center">
        <Link
          href={routes.login}
          className="inline-flex min-h-6 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Wrong email? Back to sign in
        </Link>
      </div>
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
        <p className="text-sm text-muted-foreground">
          Open the verification link from your registration flow to continue.
        </p>
      </header>

      <div className="flex gap-2">
        <Button
          render={<Link href={routes.login} />}
            variant="outline"
          className="flex-1"
        >
          Sign in
        </Button>
        <Button
          render={<Link href={routes.register} />}
            className="flex-1"
        >
          Create account
        </Button>
      </div>
    </div>
  );
}
