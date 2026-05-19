/**
 * Purpose: Server actions for admin staff management forms.
 * Responsibilities: translate FormData into staff API payloads and redirect after successful writes.
 * Important notes: writes pass through API handlers so auth, validation, and branch scope stay centralized.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerApiHeaders } from "@/features/api/server-api-headers";
import { handleCreateStaff } from "@/features/staff/handlers/staff-admin.handlers";

export type StaffActionState = {
  message: string;
  success: boolean;
};

type StaffActionPayload = {
  message?: string;
  success?: boolean;
};

/**
 * Creates a staff profile through POST /api/v1/admin/staff.
 */
export async function createStaffAction(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const response = await handleCreateStaff(
    new Request("http://nikharta-roop.local/api/v1/admin/staff", {
      body: JSON.stringify(toCreateStaffBody(formData)),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handleStaffActionResponse(response, "Staff profile created.");
}

/**
 * Converts staff form fields into the JSON shape expected by the admin API.
 */
function toCreateStaffBody(formData: FormData) {
  return {
    bioEn: optionalString(formData.get("bioEn")),
    bioHi: optionalString(formData.get("bioHi")),
    branchId: stringValue(formData.get("branchId")),
    experienceYears: optionalNumber(formData.get("experienceYears")),
    isAvailable: formData.get("isAvailable") === "on",
    photoUrl: null,
    serviceIds: formData.getAll("serviceIds").map((value) => stringValue(value)),
    specialization: splitCsv(formData.get("specialization")),
    userId: stringValue(formData.get("userId")),
    workDays: formData.getAll("workDays").map((value) => Number(stringValue(value))),
    workEnd: stringValue(formData.get("workEnd")),
    workStart: stringValue(formData.get("workStart")),
  };
}

/**
 * Handles success redirects and validation failures from the staff API.
 */
async function handleStaffActionResponse(
  response: Response,
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => null)) as
    | StaffActionPayload
    | null;

  if (response.ok && payload?.success === true) {
    revalidatePath("/admin/staff");
    redirect("/admin/staff");
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
 * Converts optional numeric fields while preserving blank values as null.
 */
function optionalNumber(value: FormDataEntryValue | null) {
  const text = stringValue(value);

  return text.length > 0 ? Number(text) : null;
}

/**
 * Converts comma-separated tags into the staff specialization array.
 */
function splitCsv(value: FormDataEntryValue | null) {
  return stringValue(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
