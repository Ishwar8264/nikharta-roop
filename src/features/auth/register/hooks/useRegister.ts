"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api/backend.client";

import { FIELD } from "../../shared/constants";
import { registerSchema } from "../../shared/schemas";
import type { FieldError, RegisterInput } from "../../shared/types";
import { registerApi } from "../api/register";

interface UseRegisterResult {
  register: (input: RegisterInput) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

/**
 * Submits a registration and routes to email verification.
 *
 * Why /verify-otp instead of /login:
 * The backend blocks login until emailVerified is true. Sending a fresh user
 * to /login would land them on a 403 with no path forward. The verify page
 * owns the send → enter code → done flow, and now also issues session cookies
 * on success — so the user is signed in as soon as they verify.
 *
 * Why no credentials are held in sessionStorage:
 * The verify endpoint issues tokens on success, so there is no need to
 * replay the password. That pattern was only a workaround for an endpoint
 * that didn't return a session; with the backend fixed, the workaround goes
 * away — and with it, the risk of a password living in browser storage.
 */
export function useRegister(): UseRegisterResult {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function register(input: RegisterInput) {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse(input);
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
      await registerApi(parsed.data);

      const email = parsed.data.email;
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
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
        } else if (e.status === 409) {
          const message = e.message.toLowerCase();
          if (message.includes("email")) {
            setFieldErrors({
              [FIELD.email]: "This email is already registered",
            });
          } else if (message.includes("phone")) {
            setFieldErrors({
              [FIELD.phone]: "This phone is already registered",
            });
          }
          setError(e.message);
        } else {
          setError(e.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { register, isLoading, error, fieldErrors };
}
