"use client";

import { useState } from "react";

import { ApiError } from "@/lib/api/backend.client";

import { createServiceApi, updateServiceApi } from "./api";
import {
  createServiceFormSchema,
  type CreateServiceFormValues,
} from "./schema";
import type { ApiFieldError, CreatedService, SalonService } from "./types";

interface CreateServiceState {
  save: (input: CreateServiceFormValues) => Promise<CreatedService | null>;
  error: string | null;
  fieldErrors: Record<string, string>;
  isLoading: boolean;
}

/** Creates or updates a service and preserves backend validation messages. */
export function useServiceForm(salonRef: string, initialService?: SalonService): CreateServiceState {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function save(
    input: CreateServiceFormValues,
  ): Promise<CreatedService | null> {
    setError(null);
    setFieldErrors({});

    const validation = createServiceFormSchema.safeParse(input);
    if (!validation.success) {
      setFieldErrors(toFieldErrorMap(validation.error.issues));
      return null;
    }

    setIsLoading(true);
    try {
      if (initialService) {
        const changes: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(validation.data)) {
          const previous = initialService[key as keyof SalonService];
          const next = value === undefined ? null : value;
          if (JSON.stringify(next) !== JSON.stringify(previous)) changes[key] = next;
        }
        if (Object.keys(changes).length === 0) return initialService;
        const response = await updateServiceApi(salonRef, initialService.id, changes);
        return response.data.service;
      }
      const response = await createServiceApi(salonRef, validation.data);
      return response.data.service;
    } catch (caught) {
      if (caught instanceof ApiError) {
        const payload = caught.data as { errors?: ApiFieldError[] } | null;
        if (payload?.errors?.length) {
          setFieldErrors(toFieldErrorMap(payload.errors));
        }
        setError(caught.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { save, error, fieldErrors, isLoading };
}

function toFieldErrorMap(
  issues: ReadonlyArray<{ path?: PropertyKey[]; field?: string; message: string }>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.field ?? issue.path?.join(".") ?? "_form";
    if (!result[field]) result[field] = issue.message;
  }
  return result;
}
