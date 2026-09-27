"use client";

import Link from "next/link";
import { LockKeyhole, Mail, Phone, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { PasswordField } from "@/features/auth/shared/components/password-field";
import { FIELD } from "@/features/auth/shared/constants";
import { useRegister } from "../hooks/useRegister";

/**
 * Registration form.
 *
 * Why this is a Client Component:
 * It owns submit handling, loading state, and error rendering — all
 * inherently interactive. The page that renders it stays server-side; only
 * this subtree ships to the browser.
 *
 * Why FormData instead of controlled inputs:
 * The backend is the source of truth for validation and returns per-field
 * errors. Mirroring every input in React state adds 4 useState calls and
 * re-renders per keystroke for no benefit. FormData + a single submit
 * handler keeps the component small.
 *
 * Why noValidate:
 * The browser's native validation bubbles up with its own UI language and
 * timing. We use zod on submit so the user sees errors in our design system,
 * in a consistent position.
 */
export function RegisterForm() {
  const { register, isLoading, error, fieldErrors } = useRegister();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const phone = String(formData.get(FIELD.phone) ?? "").trim();

    await register({
      name: String(formData.get(FIELD.name) ?? "").trim(),
      email: String(formData.get(FIELD.email) ?? "").trim(),
      // Empty string must be omitted, not sent as "" — backend rejects it.
      ...(phone ? { phone } : {}),
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
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start booking your next salon visit.
        </p>
      </header>

      <FormError>{error}</FormError>

      <Field
        id={FIELD.name}
        label="Full name"
        autoComplete="name"
        placeholder="Enter your full name"
        icon={<UserRound className="size-4" />}
        error={fieldErrors[FIELD.name]}
        disabled={isLoading}
      />

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

      <Field
        id={FIELD.phone}
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        placeholder="+91 98765 43210"
        icon={<Phone className="size-4" />}
        error={fieldErrors[FIELD.phone]}
        disabled={isLoading}
      />

      <PasswordField
        id={FIELD.password}
        label="Password"
        autoComplete="new-password"
        placeholder="Create a strong password"
        icon={<LockKeyhole className="size-4" />}
        error={fieldErrors[FIELD.password]}
        disabled={isLoading}
      />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={routes.login}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
