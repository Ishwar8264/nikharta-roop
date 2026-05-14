"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Phone, User } from "lucide-react";
import {
  AuthFormHeader,
  authButtonClassName,
  authFormClassName,
  authInputClassName,
} from "@/components/auth/auth-ui";
import { IdentifierCheckField } from "@/components/auth/identifier-check-field";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { Button } from "@/components/ui/button";
import {
  showError,
  showSuccess,
} from "@/components/ui/shared/toast/custom-toast";
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

      if (result.success) {
        showSuccess("OTP sent", result.message);
      } else {
        showError("Signup failed", result.message);
      }

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
      className={authFormClassName}
    >
      <AuthFormHeader
        title="Create Account"
        subtitle="Fill in the details to get started"
      />

      <div className="mt-7 space-y-5">
        <InputField
          name="name"
          label="Name"
          placeholder="Enter your name"
          type="text"
          autoComplete="name"
          leftIcon={<User className="h-4 w-4" />}
          inputClassName={authInputClassName}
          helperText="2–100 characters"
        />

        <IdentifierCheckField
          name="email"
          purpose="SIGNUP"
          label="Email"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          leftIcon={<Mail className="h-4 w-4" />}
          inputClassName={authInputClassName}
          helperText="Optional — but we'll send updates here"
        />

        <IdentifierCheckField
          name="mobile"
          purpose="SIGNUP"
          label="Mobile Number"
          placeholder="9876543210"
          type="tel"
          autoComplete="tel"
          required
          leftIcon={<Phone className="h-4 w-4" />}
          inputClassName={authInputClassName}
          helperText="10-digit Indian mobile number"
        />

        {state && !state.success ? (
          <p className="text-sm text-destructive">{state.message}</p>
        ) : null}

        <Button
          type="submit"
          className={`w-full ${authButtonClassName}`}
          disabled={isPending}
        >
          {isPending ? "Sending OTP..." : "Register"}
        </Button>
      </div>

      <p className="mt-7 text-center text-sm text-muted-foreground">
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
