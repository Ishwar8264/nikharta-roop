"use client";

import Link from "next/link";

import {
  AuthFormHeader,
  authButtonClassName,
  authFormClassName,
} from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { IdentifierModeSwitch } from "./identifier-mode-switch";
import { LoginIdentifierField } from "./login-identifier-field";
import { useLoginForm } from "./use-login-form";

const LoginForm = () => {
  const form = useLoginForm();

  return (
    <form onSubmit={form.handleSubmit} className={authFormClassName}>
      <AuthFormHeader
        title="Welcome Back"
        subtitle="Enter your mobile number or email to login"
      />

      <div className="mt-7 space-y-5">
        <IdentifierModeSwitch
          mode={form.identifierMode}
          onModeChange={form.handleIdentifierModeChange}
        />

        {/* The API receives one `identifier`; this field only changes UX. */}
        <LoginIdentifierField
          Icon={form.ActiveIdentifierIcon}
          error={form.identifierError ?? undefined}
          isMobileMode={form.isMobileMode}
          mode={form.identifierMode}
          onBeforeInput={form.handleIdentifierBeforeInput}
          onChange={form.handleIdentifierChange}
          shouldCheck={form.shouldCheckIdentifier}
        />

        {form.state && !form.state.success ? (
          <p className="text-sm text-destructive">{form.state.message}</p>
        ) : null}

        <Button
          type="submit"
          className={`w-full ${authButtonClassName}`}
          disabled={form.isPending}
        >
          {form.isPending ? "Sending OTP..." : "Login"}
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
