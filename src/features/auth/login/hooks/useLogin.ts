"use client";

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
 *   - error: form-level failures (401 invalid creds/deactivated, 500)
 *
 * The server returns the same 401 response for unknown emails, wrong
 * passwords, and unverified accounts, so no branch here may treat any of
 * them specially — doing so would re-create the enumeration signal the API
 * removed. The verification OTP is re-sent server-side to real owners.
 *
 * Why router.refresh() before navigation:
 * The login route sets cookies, but Server Components already rendered with
 * the old (unauthenticated) cookies. `refresh()` re-fetches server data so
 * the header/layout immediately reflect the signed-in state. Without it, a
 * server-rendered user menu would still show "Sign in" until a hard reload.
 */
export function useLogin(): UseLoginResult {
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

      // A document navigation guarantees the next Server Component request
      // includes the newly-issued HttpOnly cookies. It also avoids racing a
      // refresh of the stale /login tree against client-side navigation.
      window.location.replace(getPostLoginDestination());
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
          // Invalid credentials, unverified accounts, deactivated accounts,
          // and server failures all surface as a banner. A 401 must NOT be
          // field-mapped because that could leak whether the email or
          // password was wrong.
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

/** Returns a safe internal destination preserved by the auth proxy. */
function getPostLoginDestination(): string {
  const requested = new URLSearchParams(window.location.search).get("redirect");

  // Protocol-relative paths (`//host`) are external even though they start
  // with a slash, so only a single leading slash is accepted.
  if (requested?.startsWith("/") && !requested.startsWith("//")) {
    return requested;
  }

  return routes.dashboard;
}

/**
 * Re-exported FIELD for symmetry with use-register, in case consumers want
 * to reference field names without importing constants directly.
 */
export { FIELD };
