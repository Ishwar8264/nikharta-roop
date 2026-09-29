"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api/backend.client";

import { createSalonApi } from "../api/create";
import { createSalonSchema, type CreateSalonFormValues } from "../schemas";
import type { FieldError, PublicSalon } from "../types";

interface UseCreateSalonResult {
  create: (input: CreateSalonFormValues) => Promise<PublicSalon | null>;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

/**
 * Submits the salon create form.
 *
 * Why two error buckets:
 *   - fieldErrors: 400 responses carry per-field issues that map to inputs
 *   - error: 409 (slug taken), 401 (session lost), 500, network
 *
 * Why the caller handles navigation:
 * The form may want to redirect to the salon detail, show a toast, or keep
 * the user on the page for review. The hook returns the created salon and
 * leaves that decision to the caller.
 */
export function useCreateSalon(): UseCreateSalonResult {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function create(
    input: CreateSalonFormValues,
  ): Promise<PublicSalon | null> {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    const parsed = createSalonSchema.safeParse(input);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".") || "_form";
        if (!map[field]) map[field] = issue.message;
      }
      setFieldErrors(map);
      setIsLoading(false);
      return null;
    }

    try {
      const res = await createSalonApi(parsed.data);
      // Refresh so any server component (dashboard sidebar, etc.) sees the
      // new salon without a hard reload.
      router.refresh();
      return res.data.salon;
    } catch (e) {
      if (e instanceof ApiError) {
        const data = e.data as { errors?: FieldError[] } | null;

        if (e.status === 400 && data?.errors?.length) {
          const map: Record<string, string> = {};
          for (const { field, message } of data.errors) {
            if (!map[field]) map[field] = message;
          }
          setFieldErrors(map);
        } else if (e.status === 409) {
          setFieldErrors({ slug: e.message });
        } else {
          setError(e.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { create, isLoading, error, fieldErrors };
}
