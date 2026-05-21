/**
 * Purpose: Server actions for admin service management forms.
 * Responsibilities: translate browser FormData into service API payloads and redirect after successful writes.
 * Important notes: all writes still pass through API handlers so auth, validation, and branch scope stay centralized.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/features/api/server-action-auth";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleCreateAdminService,
  handleCreateServiceCategory,
} from "@/features/services/handlers/service-admin.handlers";

export type ServiceActionState = {
  message: string;
  success: boolean;
};

type ServiceActionPayload = {
  message?: string;
  success?: boolean;
};

/**
 * Creates a service category through POST /api/v1/admin/services/categories.
 */
export async function createServiceCategoryAction(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleCreateServiceCategory(
    new Request("http://nikharta-roop.local/api/v1/admin/services/categories", {
      body: JSON.stringify(toCreateServiceCategoryBody(formData)),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handleServiceActionResponse(response, {
    fallbackMessage: "Service category created.",
    redirectPath: "/admin/services/new",
    revalidatePaths: ["/admin/services", "/admin/services/new"],
  });
}

/**
 * Creates a service through POST /api/v1/admin/services.
 */
export async function createServiceAction(
  _previousState: ServiceActionState,
  formData: FormData,
): Promise<ServiceActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleCreateAdminService(
    new Request("http://nikharta-roop.local/api/v1/admin/services", {
      body: JSON.stringify(toCreateServiceBody(formData)),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handleServiceActionResponse(response, {
    fallbackMessage: "Service created.",
    redirectPath: "/admin/services",
    revalidatePaths: ["/admin/services"],
  });
}

/**
 * Converts service category form fields into the JSON shape expected by the admin API.
 */
function toCreateServiceCategoryBody(formData: FormData) {
  return {
    branchId: optionalString(formData.get("branchId")),
    description: optionalString(formData.get("description")),
    isActive: formData.get("isActive") === "on",
    nameEn: stringValue(formData.get("nameEn")),
    nameHi: stringValue(formData.get("nameHi")),
    slug: stringValue(formData.get("slug")),
    sortOrder: numberValue(formData.get("sortOrder")),
  };
}

/**
 * Converts service form fields into the JSON shape expected by the admin API.
 */
function toCreateServiceBody(formData: FormData) {
  return {
    advanceAmount: optionalNumber(formData.get("advanceAmount")),
    branchId: stringValue(formData.get("branchId")),
    categoryId: stringValue(formData.get("categoryId")),
    descriptionEn: optionalString(formData.get("descriptionEn")),
    descriptionHi: stringValue(formData.get("descriptionHi")),
    durationMinutes: numberValue(formData.get("durationMinutes")),
    imageUrl: optionalString(formData.get("imageUrl")),
    isActive: formData.get("isActive") === "on",
    nameEn: stringValue(formData.get("nameEn")),
    nameHi: stringValue(formData.get("nameHi")),
    price: numberValue(formData.get("price")),
    slug: stringValue(formData.get("slug")),
  };
}

/**
 * Handles success redirects and validation failures from the service API.
 */
async function handleServiceActionResponse(
  response: Response,
  input: {
    fallbackMessage: string;
    redirectPath: string;
    revalidatePaths: string[];
  },
) {
  const payload = (await response.json().catch(() => null)) as
    | ServiceActionPayload
    | null;

  if (response.ok && payload?.success === true) {
    input.revalidatePaths.forEach((path) => revalidatePath(path));
    redirect(input.redirectPath);
  }

  return {
    message: payload?.message ?? input.fallbackMessage,
    success: false,
  };
}

/**
 * Reads required string fields from FormData while keeping API validation authoritative.
 */
function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Reads optional string fields and converts blank values to null for nullable API fields.
 */
function optionalString(value: FormDataEntryValue | null) {
  const text = stringValue(value);

  return text.length > 0 ? text : null;
}

/**
 * Reads required numeric fields with NaN fallback handled by Zod validation.
 */
function numberValue(value: FormDataEntryValue | null) {
  return Number(stringValue(value));
}

/**
 * Reads optional numeric fields and omits blanks from the create payload.
 */
function optionalNumber(value: FormDataEntryValue | null) {
  const text = stringValue(value);

  return text.length > 0 ? Number(text) : null;
}
