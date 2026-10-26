"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api/backend.client";

import { forgotPasswordSchema } from "../../shared/schemas";
import type { FieldError } from "../../shared/types";
import { forgotPasswordApi } from "../api/forgot-password";

interface UseForgotPasswordResult {
  submit: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

/**
 * Submits an email to start the reset flow and routes to the reset page.
 *
 * Why we always route on success (even 200-for-unknown-email):
 * The backend deliberately returns 200 for unregistered emails to prevent
 * enumeration. Route the user forward regardless — the reset page will fail
 * on a bad code, and that failure is indistinguishable from a wrong code on
 * a real account.
 */
export function useForgotPassword(): UseForgotPasswordResult {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(email: string) {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".") || "_form";
        if (!map[field]) map[field] = issue.message;
      }
      setFieldErrors(map);
      setError("Please fix the highlighted field");
      setIsLoading(false);
      return;
    }

    try {
      const res = await forgotPasswordApi(parsed.data);
      const retry = res.data.resendAvailableInSeconds;
      router.push(
        `/reset-password?email=${encodeURIComponent(parsed.data.email)}&cooldown=${retry}`,
      );
    } catch (e) {
      if (e instanceof ApiError) {
        // 429 means a code was already sent recently — the user can still
        // proceed to the reset page, we just skip the "we just sent it"
        // framing. Keep them moving instead of blocking on the cooldown.
        if (e.status === 429) {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(e.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { submit, isLoading, error, fieldErrors };
}

/** Re-exported for typing convenience in the form. */
export type { FieldError };
