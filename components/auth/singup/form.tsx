"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone, User } from "lucide-react";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/shared/logo/logo";
import {
  startSignupAction,
} from "@/features/auth/actions/auth.actions";
import type { AuthActionState } from "@/features/auth/actions/auth-action.types";

const RegisterForm = () => {
  const router = useRouter();
  const [state, setState] = React.useState<AuthActionState | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Signup starts on the server. The browser submits form data to a Server
  // Action, and the action reuses the existing auth handler to create the OTP.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await startSignupAction(formData);
      setState(result);

      // Redirect destination comes from the action so the client does not need
      // to know auth flow details beyond rendering the next screen.
      if (result.success && result.data?.redirectTo) {
        router.push(result.data.redirectTo);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-gray-200 bg-white px-8 pt-6 pb-8 shadow-sm"
    >
      {/* ── Logo & Header grouped tightly ── */}
      <div className="flex flex-col items-center space-y-2">
        <Logo size="lg" />

        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            Create Account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill in the details to get started
          </p>
        </div>
      </div>

      {/* ── Form Fields ── */}
      <div className="mt-6 space-y-5">
        {/* ── Name ── */}
        <InputField
          name="name"
          label="Name"
          placeholder="Enter your name"
          type="text"
          autoComplete="name"
          leftIcon={<User className="h-4 w-4" />}
          helperText="2–100 characters"
        />

        {/* ── Email ── */}
        <InputField
          name="email"
          label="Email"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          helperText="Optional — but we'll send updates here"
        />

        {/* ── Mobile ── */}
        <InputField
          name="mobile"
          label="Mobile Number"
          placeholder="9876543210"
          type="tel"
          autoComplete="tel"
          required
          leftIcon={<Phone className="h-4 w-4" />}
          helperText="10-digit Indian mobile number"
        />

        {state && (
          // Show server validation/OTP messages without exposing token data.
          <p
            className={
              state.success
                ? "text-sm text-green-700"
                : "text-sm text-destructive"
            }
          >
            {state.message}
          </p>
        )}

        {/* ── Submit ── */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending OTP..." : "Register"}
        </Button>
      </div>

      {/* ── Login Link ── */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Login
        </Link>
      </p>
    </form>
  );
};

RegisterForm.displayName = "RegisterForm";

export { RegisterForm };
