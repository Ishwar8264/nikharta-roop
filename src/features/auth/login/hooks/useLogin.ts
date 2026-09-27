"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";

import { FIELD } from "../../shared/constants";
import { loginSchema } from "../../shared/schemas";
import type { FieldError, LoginInput } from "../../shared/types";
import { loginApi } from "../api/login";

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
 * Why respect ?redirect:
 * The middleware appends `?redirect=/dashboard` when it kicks an
 * unauthenticated visitor out of a protected page. Honoring it here sends
 * the user back where they were trying to go — no second navigation.
 *
 * Why router.refresh() before push:
 * The login route sets cookies, but Server Components already rendered with
 * the old (unauthenticated) cookies. `refresh()` re-fetches server data so
 * the header/layout immediately reflect the signed-in state. Without it, a
 * server-rendered user menu would still show "Sign in" until a hard reload.
 */
export function useLogin(): UseLoginResult {
  const router = useRouter();
  const searchParams = useSearchParams();
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

      const requestedRedirect = searchParams.get("redirect");
      const redirectTo = isSafeInternalPath(requestedRedirect)
        ? requestedRedirect
        : routes.home;
      router.push(redirectTo);
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
          // 401 invalid credentials, 403 unverified/deactivated, 500 — all
          // surface as a banner. 401 in particular must NOT be field-mapped
          // (mapping it to email/password would leak which one was wrong).
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

/** Prevents user-controlled redirect params from navigating off-site. */
function isSafeInternalPath(path: string | null): path is string {
  return Boolean(path?.startsWith("/") && !path.startsWith("//"));
}
