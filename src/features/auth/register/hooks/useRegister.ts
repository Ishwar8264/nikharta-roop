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
  /** Form-level error (network, conflict, server). */
  error: string | null;
  /** Field-level errors keyed by field name for inline display. */
  fieldErrors: Record<string, string>;
}

/**
 * Submits a registration and routes on success.
 *
 * Why two error buckets:
 *   - fieldErrors: per-input inline messages (client validation OR backend
 *     `errors[]` array). User sees exactly which input is wrong.
 *   - error: one banner for everything form-level (409 email exists, 500,
 *     network). No single input to attach it to.
 *
 * Why redirect to /login, not /dashboard:
 * The register endpoint does NOT issue tokens. There is no session yet.
 * Sending the user to /login with `?registered=1` lets the login page show
 * a "Account created" notice — cleaner than an auto-login chain that would
 * silently fail if the backend later adds email verification.
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

    /**
     * Client-side validation runs first.
     *
     * Why:
     * The server re-validates anyway (it's the source of truth), but a
     * round-trip for a name that's 1 character is wasteful and slow. Running
     * the same zod schema here gives instant feedback; if it passes, we still
     * let the server confirm.
     *
     * The transform on email (lowercase) also runs here, so what we POST
     * matches what the server would have normalized anyway.
     */
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".") || "_form";
        // Keep the first error per field — matches what users expect.
        if (!map[field]) map[field] = issue.message;
      }
      setFieldErrors(map);
      setError("Please fix the highlighted fields");
      setIsLoading(false);
      return;
    }

    try {
      await registerApi(parsed.data);
      router.push("/login?registered=1");
    } catch (e) {
      if (e instanceof ApiError) {
        const data = e.data as { errors?: FieldError[] } | null;

        // Backend 400 with per-field breakdown.
        if (e.status === 400 && data?.errors?.length) {
          const map: Record<string, string> = {};
          for (const { field, message } of data.errors) {
            if (!map[field]) map[field] = message;
          }
          setFieldErrors(map);
          setError("Please fix the highlighted fields");
        } else if (e.status === 409) {
          // Email/phone conflict — attach to the specific input when possible.
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
