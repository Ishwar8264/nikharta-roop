/**
 * Purpose: Server actions for admin offer management forms.
 * Responsibilities: translate FormData into offer API payloads and redirect after successful writes.
 * Important notes: writes pass through offer handlers so auth, validation, and branch scope stay centralized.
 */
"use server";

import { DiscountType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerApiHeaders } from "@/features/api/server-api-headers";
import { handleCreateAdminOffer } from "@/features/offers/handlers/offer.handlers";

export type OfferActionState = {
  message: string;
  success: boolean;
};

type OfferActionPayload = {
  message?: string;
  success?: boolean;
};

/**
 * Creates an offer through POST /api/v1/admin/offers.
 */
export async function createOfferAction(
  _previousState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const response = await handleCreateAdminOffer(
    new Request("http://nikharta-roop.local/api/v1/admin/offers", {
      body: JSON.stringify(toCreateOfferBody(formData)),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handleOfferActionResponse(response, "Offer created.");
}

/**
 * Converts offer form fields into the JSON shape expected by the admin API.
 */
function toCreateOfferBody(formData: FormData) {
  const branchId = stringValue(formData.get("branchId"));

  return {
    branchId: branchId || undefined,
    code: stringValue(formData.get("code")),
    descriptionHi: optionalString(formData.get("descriptionHi")),
    discountType: discountTypeValue(formData.get("discountType")),
    discountValue: numberValue(formData.get("discountValue")),
    isActive: formData.get("isActive") === "on",
    maxDiscount: optionalNumber(formData.get("maxDiscount")),
    minOrder: optionalNumber(formData.get("minOrder")),
    perUserLimit: optionalNumber(formData.get("perUserLimit")),
    serviceIds: formData.getAll("serviceIds").map((value) => stringValue(value)),
    titleEn: optionalString(formData.get("titleEn")),
    titleHi: stringValue(formData.get("titleHi")),
    usageLimit: optionalNumber(formData.get("usageLimit")),
    validFrom: stringValue(formData.get("validFrom")),
    validUntil: stringValue(formData.get("validUntil")),
  };
}

/**
 * Handles success redirects and validation failures from the offer API.
 */
async function handleOfferActionResponse(
  response: Response,
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => null)) as
    | OfferActionPayload
    | null;

  if (response.ok && payload?.success === true) {
    revalidatePath("/admin/offers");
    revalidatePath("/offers");
    redirect("/admin/offers");
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

/**
 * Narrows discount type form values into Prisma enum values.
 */
function discountTypeValue(value: FormDataEntryValue | null) {
  return stringValue(value) === DiscountType.FLAT_AMOUNT
    ? DiscountType.FLAT_AMOUNT
    : DiscountType.PERCENTAGE;
}
