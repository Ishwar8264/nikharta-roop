/**
 * Purpose: Server actions for admin portfolio management forms.
 * Responsibilities: translate FormData into portfolio API payloads and redirect after successful writes.
 * Important notes: writes pass through portfolio handlers so auth, validation, and branch scope stay centralized.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/features/api/server-action-auth";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import { handleCreateAdminPortfolio } from "@/features/portfolio/handlers/portfolio.handlers";

export type PortfolioActionState = {
  message: string;
  success: boolean;
};

type PortfolioActionPayload = {
  message?: string;
  success?: boolean;
};

/**
 * Creates a portfolio item through POST /api/v1/admin/portfolio.
 */
export async function createPortfolioAction(
  _previousState: PortfolioActionState,
  formData: FormData,
): Promise<PortfolioActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleCreateAdminPortfolio(
    new Request("http://nikharta-roop.local/api/v1/admin/portfolio", {
      body: JSON.stringify(toCreatePortfolioBody(formData)),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handlePortfolioActionResponse(response, "Could not create portfolio item.");
}

/**
 * Converts portfolio form fields into the JSON shape expected by the admin API.
 */
function toCreatePortfolioBody(formData: FormData) {
  return {
    afterImageUrl: optionalString(formData.get("afterImageUrl")),
    beforeImageUrl: optionalString(formData.get("beforeImageUrl")),
    branchId: stringValue(formData.get("branchId")),
    descriptionHi: optionalString(formData.get("descriptionHi")),
    imageUrls: formData.getAll("imageUrls").flatMap((value) => {
      const imageUrl = stringValue(value);

      return imageUrl ? [imageUrl] : [];
    }),
    isFeatured: formData.get("isFeatured") === "on",
    isPublished: formData.get("isPublished") === "on",
    packageId: optionalString(formData.get("packageId")),
    serviceId: optionalString(formData.get("serviceId")),
    sortOrder: optionalNumber(formData.get("sortOrder")),
    staffId: optionalString(formData.get("staffId")),
    titleHi: optionalString(formData.get("titleHi")),
  };
}

/**
 * Handles success redirects and validation failures from the portfolio API.
 */
async function handlePortfolioActionResponse(
  response: Response,
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => null)) as
    | PortfolioActionPayload
    | null;

  if (response.ok && payload?.success === true) {
    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    redirect("/admin/portfolio");
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
 * Converts optional numeric fields while preserving blank values as undefined.
 */
function optionalNumber(value: FormDataEntryValue | null) {
  const text = stringValue(value);

  return text.length > 0 ? Number(text) : undefined;
}
