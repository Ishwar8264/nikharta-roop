"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api/backend.client";

import { resetPasswordSchema } from "../../shared/schemas";
import type { FieldError } from "../../shared/types";
import { forgotPasswordApi } from "../api/forgot-password";
import { resetPasswordApi } from "../api/reset-password";

interface UseResetPasswordResult {
  email: string;
  code: string;
  setCode: (code: string) => void;
  /** Submit the reset. */
  submit: (newPassword: string) => Promise<void>;
  /** Request a fresh code. */
  resend: () => Promise<void>;

  isLoading: boolean;
  isResending: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  /** Seconds remaining before resend. 0 = available. */
  resendIn: number;
}

/**
 * Orchestrates the reset step: enter code + new password, submit.
 *
 * Why the initial cooldown comes from the query string:
 * The forgot endpoint returns resendAvailableInSeconds — carrying it across
 * the navigation means the reset page shows a live countdown immediately
 * instead of letting the user hit a surprise 429 on the first resend.
 */
export function useResetPassword(): UseResetPasswordResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const initialCooldown = Number(searchParams.get("cooldown") ?? "0") || 0;

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resendIn, setResendIn] = useState(initialCooldown);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback((seconds: number) => {
    setResendIn(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    if (seconds <= 0) return;

    timerRef.current = setInterval(() => {
      setResendIn((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }, []);

  // Kick off the countdown as soon as the page mounts if the URL carried one.
  useEffect(() => {
    if (initialCooldown > 0) startCooldown(initialCooldown);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(newPassword: string) {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    const parsed = resetPasswordSchema.safeParse({ email, code, newPassword });
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".") || "_form";
        if (!map[field]) map[field] = issue.message;
      }
      setFieldErrors(map);
      setError("Please fix the highlighted fields");
      setIsLoading(false);
      return;
    }

    try {
      await resetPasswordApi(parsed.data);
      // Hard redirect isn't needed here — /login is a fresh destination and
      // this page carries no auth state to bust. router.replace avoids a
      // Back-into-the-reset-form history entry.
      router.replace("/login?reset=1");
    } catch (e) {
      if (e instanceof ApiError) {
        const data = e.data as { errors?: FieldError[] } | null;

        if (e.status === 400 && data?.errors?.length) {
          const map: Record<string, string> = {};
          for (const { field, message } of data.errors) {
            if (!map[field]) map[field] = message;
          }
          setFieldErrors(map);
          setError("Please fix the highlighted fields");
        } else {
          setError(e.message);
          // Bad/expired code — clear it so the user can retype without
          // backspacing six times. Password field keeps its value; only the
          // code is rejected by the backend.
          if (e.status === 400 || e.status === 410 || e.status === 429) {
            setCode("");
          }
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function resend() {
    setIsResending(true);
    setError(null);

    try {
      const res = await forgotPasswordApi({ email });
      startCooldown(res.data.resendAvailableInSeconds);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 429) {
          // Already inside the cooldown window — restart the local timer so
          // the UI matches the server's view instead of lying about being
          // able to resend.
          startCooldown(60);
        }
        setError(e.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  }

  return {
    email,
    code,
    setCode,
    submit,
    resend,
    isLoading,
    isResending,
    error,
    fieldErrors,
    resendIn,
  };
}
