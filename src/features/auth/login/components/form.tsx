"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { FormSuccess } from "@/features/auth/shared/components/form-success";
import { PasswordField } from "@/features/auth/shared/components/password-field";
import { FIELD } from "@/features/auth/shared/constants";
import { useLogin } from "../hooks/useLogin";

/**
 * Login form.
 *
 * Why a Client Component:
 * It handles submit, loading state, and error rendering. The page shell
 * stays server-side; only this subtree ships to the browser.
 *
 * Why read searchParams in the form (not the page):
 * The "just registered" banner is purely a presentation concern of this
 * form. Keeping the read here means the page stays a dumb shell that could
 * be cached/pre-rendered — no `searchParams` prop drilling needed.
 */
export function LoginForm() {
  const { login, isLoading, error, fieldErrors } = useLogin();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await login({
      email: String(formData.get(FIELD.email) ?? "").trim(),
      password: String(formData.get(FIELD.password) ?? ""),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-sm space-y-5"
    >
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to manage your bookings.
        </p>
      </header>

      {justRegistered ? (
        <FormSuccess>Account created. Sign in to continue.</FormSuccess>
      ) : null}

      <FormError>{error}</FormError>

      <Field
        id={FIELD.email}
        label="Email"
        type="email"
        autoComplete="email"
        error={fieldErrors[FIELD.email]}
        disabled={isLoading}
      />

      <PasswordField
        id={FIELD.password}
        label="Password"
        autoComplete="current-password"
        error={fieldErrors[FIELD.password]}
        disabled={isLoading}
      />

      <div className="flex justify-end">
        <Link
          href={routes.forgotPassword}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={routes.register}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
