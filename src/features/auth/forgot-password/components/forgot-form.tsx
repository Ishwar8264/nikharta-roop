"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { FIELD } from "@/features/auth/shared/constants";

import { useForgotPassword } from "../hooks/use-forgot-password";

/**
 * Step 1 of password reset: collect the email address.
 *
 * Why a Client Component:
 * It owns the submit handler, loading state, and inline error rendering.
 * The page shell stays server-side.
 */
export function ForgotPasswordForm() {
  const { submit, isLoading, error, fieldErrors } = useForgotPassword();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await submit(String(formData.get(FIELD.email) ?? "").trim());
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-sm space-y-5"
    >
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a 6-digit code.
        </p>
      </header>

      <FormError>{error}</FormError>

      <Field
        id={FIELD.email}
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        icon={<Mail className="size-4" />}
        error={fieldErrors[FIELD.email]}
        disabled={isLoading}
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Sending code…" : "Send reset code"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          href={routes.login}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
