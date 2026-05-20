/**
 * Purpose: Server actions for admin package management forms.
 * Responsibilities: translate FormData into package API payloads and redirect after successful writes.
 * Important notes: writes pass through package handlers so auth, validation, and branch scope stay centralized.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerApiHeaders } from "@/features/api/server-api-headers";
import { handleCreateAdminPackage } from "@/features/packages/handlers/package.handlers";

export type PackageActionState = {
  message: string;
  success: boolean;
};

type PackageActionPayload = {
  message?: string;
  success?: boolean;
};

/**
 * Creates a package through POST /api/v1/admin/packages.
 */
export async function createPackageAction(
  _previousState: PackageActionState,
  formData: FormData,
): Promise<PackageActionState> {
  const response = await handleCreateAdminPackage(
    new Request("http://nikharta-roop.local/api/v1/admin/packages", {
      body: JSON.stringify(toCreatePackageBody(formData)),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handlePackageActionResponse(response, "Package created.");
}

/**
 * Converts package form fields into the JSON shape expected by the admin API.
 */
function toCreatePackageBody(formData: FormData) {
  return {
    advanceAmount: optionalNumber(formData.get("advanceAmount")),
    branchId: stringValue(formData.get("branchId")),
    categoryId: undefined,
    descriptionEn: optionalString(formData.get("descriptionEn")),
    descriptionHi: optionalString(formData.get("descriptionHi")),
    durationMinutes: optionalNumber(formData.get("durationMinutes")),
    imageUrl: optionalString(formData.get("imageUrl")),
    isActive: formData.get("isActive") === "on",
    isCustom: false,
    nameEn: optionalString(formData.get("nameEn")),
    nameHi: stringValue(formData.get("nameHi")),
    price: numberValue(formData.get("price")),
    services: formData.getAll("serviceIds").map((value, index) => ({
      quantity: 1,
      serviceId: stringValue(value),
      sortOrder: index,
    })),
    slug: stringValue(formData.get("slug")),
  };
}

/**
 * Handles success redirects and validation failures from the package API.
 */
async function handlePackageActionResponse(
  response: Response,
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => null)) as
    | PackageActionPayload
    | null;

  if (response.ok && payload?.success === true) {
    revalidatePath("/admin/packages");
    revalidatePath("/packages");
    redirect("/admin/packages");
  }

  return {
    message: payload?.message ?? fallbackMessage,
    success: false,
  };
}

/**
 * Reads required string fields while keeping API validation authoritative.
 */
function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Converts blank optional strings to null for nullable API fields.
 */
function optionalString(value: FormDataEntryValue | null) {
  const text = stringValue(value);

  return text.length > 0 ? text : null;
}

/**
 * Reads required numeric fields with API validation handling invalid numbers.
 */
function numberValue(value: FormDataEntryValue | null) {
  return Number(stringValue(value));
}

/**
 * Converts optional numeric fields while preserving blank values as null.
 */
function optionalNumber(value: FormDataEntryValue | null) {
  const text = stringValue(value);

  return text.length > 0 ? Number(text) : null;
}
