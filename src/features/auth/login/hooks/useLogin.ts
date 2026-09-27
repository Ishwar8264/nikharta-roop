"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";

import { FIELD } from "../../shared/constants";
import { loginSchema } from "../../shared/schemas";
import type { FieldError, LoginInput } from "../../shared/types";
import { loginApi } from "../api/login";

const EMAIL_NOT_VERIFIED_MESSAGE =
  "Please verify your email before signing in";

interface UseLoginResult {
  login: (input: LoginInput) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

/**
 * Submits credentials, then routes on success.
 *
 * Why two error buckets:
 *   - fieldErrors: client OR server validation issues (400 with `errors[]`)
 *   - error: form-level failures (401 invalid creds, 403 unverified, 500)
 *
 * Why router.refresh() before navigation:
 * The login route sets cookies, but Server Components already rendered with
 * the old (unauthenticated) cookies. `refresh()` re-fetches server data so
 * the header/layout immediately reflect the signed-in state. Without it, a
 * server-rendered user menu would still show "Sign in" until a hard reload.
 */
export function useLogin(): UseLoginResult {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function login(input: LoginInput) {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    // Client-side format validation first — same reasons as register.
    const parsed = loginSchema.safeParse(input);
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
      await loginApi(parsed.data);

      // Re-run Server Components so they see the new session cookies.
      router.refresh();

      router.replace(routes.home);
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
        } else if (
          e.status === 403 &&
          e.message === EMAIL_NOT_VERIFIED_MESSAGE
        ) {
          // The verification flow owns sending and validating the OTP. Keep
          // the validated email so the user does not need to enter it again.
          router.replace(routes.verifyOtpForEmail(parsed.data.email));
        } else {
          // Invalid credentials, deactivated accounts, and server failures
          // surface as a banner. A 401 must NOT be field-mapped because that
          // could leak whether the email or password was wrong.
          setError(e.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error, fieldErrors };
}

/**
 * Re-exported FIELD for symmetry with use-register, in case consumers want
 * to reference field names without importing constants directly.
 */
export { FIELD };
