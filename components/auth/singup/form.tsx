"use client";

import Link from "next/link";

import {
  AuthFormHeader,
  authButtonClassName,
  authFormClassName,
} from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { RegisterFields } from "./register-fields";
import { useRegisterForm } from "./use-register-form";

const RegisterForm = () => {
  const form = useRegisterForm();

  return (
    <form onSubmit={form.handleSubmit} className={authFormClassName}>
      <AuthFormHeader
        title="Create Account"
        subtitle="Fill in the details to get started"
      />

      <div className="mt-7 space-y-5">
        <RegisterFields
          emailError={form.emailError ?? undefined}
          mobileError={form.mobileError ?? undefined}
          onEmailChange={form.handleEmailChange}
          onMobileBeforeInput={form.handleMobileBeforeInput}
          onMobileChange={form.handleMobileChange}
          shouldCheckEmail={form.shouldCheckEmail}
          shouldCheckMobile={form.shouldCheckMobile}
        />

        {form.state && !form.state.success ? (
          <p className="text-sm text-destructive">{form.state.message}</p>
        ) : null}

        <Button
          type="submit"
          className={`w-full ${authButtonClassName}`}
          disabled={form.isPending}
        >
          {form.isPending ? "Sending OTP..." : "Register"}
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
