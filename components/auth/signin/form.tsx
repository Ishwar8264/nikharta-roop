"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import {
  AuthFormHeader,
  authButtonClassName,
  authFormClassName,
  authInputClassName,
} from "@/components/auth/auth-ui";
import { IdentifierCheckField } from "@/components/auth/identifier-check-field";
import { Button } from "@/components/ui/button";
import {
  showError,
  showSuccess,
} from "@/components/ui/shared/toast/custom-toast";
import {
  startSigninAction,
} from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";
import { cn } from "@/lib/utils";

type IdentifierMode = "mobile" | "email";

const identifierOptions: Array<{
  value: IdentifierMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: "mobile",
    label: "Phone",
    icon: Phone,
  },
  {
    value: "email",
    label: "Email",
    icon: Mail,
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_MOBILE_PATTERN = /^[6-9]\d{9}$/;

function getIdentifierError(value: string, mode: IdentifierMode) {
  if (!value) {
    return null;
  }

  if (mode === "mobile") {
    return INDIAN_MOBILE_PATTERN.test(value)
      ? null
      : "Enter a valid 10-digit Indian mobile number";
  }

  return EMAIL_PATTERN.test(value)
    ? null
    : "Enter a valid email address";
}

function getIdentifierSubmitError(value: string, mode: IdentifierMode) {
  if (!value) {
    return mode === "mobile"
      ? "Enter your mobile number"
      : "Enter your email address";
  }

  return getIdentifierError(value, mode);
}

const LoginForm = () => {
  const router = useRouter();
  const [state, setState] = React.useState<AuthActionState | null>(null);
  const [identifierMode, setIdentifierMode] =
    React.useState<IdentifierMode>("mobile");
  const [identifierError, setIdentifierError] = React.useState<string | null>(
    null,
  );
  const [isPending, startTransition] = React.useTransition();
  const isMobileMode = identifierMode === "mobile";
  const ActiveIdentifierIcon = isMobileMode ? Phone : Mail;
  const shouldCheckIdentifier = React.useCallback(
    (value: string) => !getIdentifierError(value, identifierMode),
    [identifierMode],
  );

  // The form submits to a Server Action instead of fetching an API route.
  // Network tab may show the Server Action request, but `/api/v1/auth/login`
  // is never called directly from the browser.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const validationError = getIdentifierSubmitError(
      identifier,
      identifierMode,
    );

    if (validationError) {
      setIdentifierError(validationError);
      showError("Signin failed", validationError);
      return;
    }

    formData.set("identifier", identifier);

    startTransition(async () => {
      const result = await startSigninAction(formData);
      setState(result);

      if (result.success) {
        showSuccess("OTP sent", result.message);
      } else {
        showError("Signin failed", result.message);
      }

      // The action decides the next safe route. The client only follows that
      // redirect target and does not inspect auth tokens or cookies.
      if (result.success && result.data?.redirectTo) {
        router.push(result.data.redirectTo);
      }
    });
  }

  function handleIdentifierModeChange(nextMode: IdentifierMode) {
    setIdentifierMode(nextMode);
    setIdentifierError(null);
    setState(null);
  }

  function handleIdentifierChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Phone mode is digits-only. Email mode only strips whitespace, then the
    // format check runs before identifier availability and before submit.
    const nextValue = isMobileMode
      ? event.currentTarget.value.replace(/\D/g, "").slice(0, 10)
      : event.currentTarget.value.replace(/\s/g, "");

    event.currentTarget.value = nextValue;
    setIdentifierError(getIdentifierError(nextValue, identifierMode));
    setState(null);
  }

  function handleIdentifierBeforeInput(event: React.FormEvent<HTMLInputElement>) {
    const inputEvent = event.nativeEvent as InputEvent;

    if (isMobileMode && inputEvent.data && /\D/.test(inputEvent.data)) {
      event.preventDefault();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={authFormClassName}
    >
      <AuthFormHeader
        title="Welcome Back"
        subtitle="Enter your mobile number or email to login"
      />

      <div className="mt-7 space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-950">Login with</p>
          <div className="grid grid-cols-2 rounded-xl border border-input bg-muted/40 p-1">
            {identifierOptions.map((option) => {
              const Icon = option.icon;
              const isActive = identifierMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleIdentifierModeChange(option.value)}
                  className={cn(
                    "flex h-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white text-stone-950 shadow-sm"
                      : "text-muted-foreground hover:text-stone-950",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* The backend still receives a single `identifier` field.
            Switching modes only changes the UI, keyboard, and helper copy. */}
        <IdentifierCheckField
          key={identifierMode}
          name="identifier"
          purpose="LOGIN"
          label={isMobileMode ? "Mobile Number" : "Email Address"}
          placeholder={isMobileMode ? "9876543210" : "you@example.com"}
          type={isMobileMode ? "tel" : "email"}
          autoComplete={isMobileMode ? "tel" : "email"}
          inputMode={isMobileMode ? "numeric" : "email"}
          maxLength={isMobileMode ? 10 : 254}
          pattern={isMobileMode ? "[6-9][0-9]{9}" : undefined}
          required
          leftIcon={<ActiveIdentifierIcon className="h-4 w-4" />}
          clientError={identifierError ?? undefined}
          inputClassName={authInputClassName}
          onBeforeInput={handleIdentifierBeforeInput}
          onChange={handleIdentifierChange}
          shouldCheck={shouldCheckIdentifier}
          title={
            isMobileMode
              ? "Enter a valid 10-digit Indian mobile number"
              : "Enter a valid email address"
          }
          helperText={
            isMobileMode
              ? "Use your registered mobile number"
              : "Use your registered email address"
          }
        />

        {state && !state.success ? (
          <p className="text-sm text-destructive">{state.message}</p>
        ) : null}

        <Button
          type="submit"
          className={`w-full ${authButtonClassName}`}
          disabled={isPending}
        >
          {isPending ? "Sending OTP..." : "Login"}
        </Button>
      </div>

      <p className="mt-7 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Register
        </Link>
      </p>
    </form>
  );
};

LoginForm.displayName = "LoginForm";

export { LoginForm };
