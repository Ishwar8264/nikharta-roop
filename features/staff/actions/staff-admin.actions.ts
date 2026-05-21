/**
 * Purpose: Server actions for admin staff management forms.
 * Responsibilities: translate FormData into staff API payloads and redirect after successful writes.
 * Important notes: writes pass through API handlers so auth, validation, and branch scope stay centralized.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/features/api/server-action-auth";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import { handleCreateStaff } from "@/features/staff/handlers/staff-admin.handlers";
import {
  handleAssignStaffService,
  handleRemoveStaffService,
} from "@/features/staff/handlers/staff-service-admin.handlers";

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
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleCreateStaff(
    new Request("http://nikharta-roop.local/api/v1/admin/staff", {
      body: JSON.stringify(toCreateStaffBody(formData)),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handleStaffActionResponse(response, {
    fallbackMessage: "Staff profile created.",
    redirectPath: "/admin/staff",
    revalidatePaths: ["/admin/staff"],
  });
}

/**
 * Assigns one active branch service to a staff profile.
 */
export async function assignStaffServiceAction(
  staffId: string,
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleAssignStaffService(
    new Request(`http://nikharta-roop.local/api/v1/admin/staff/${staffId}/services`, {
      body: JSON.stringify({
        serviceId: stringValue(formData.get("serviceId")),
      }),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
    staffId,
  );

  return handleStaffActionResponse(response, {
    fallbackMessage: "Staff service assigned.",
    redirectPath: `/admin/staff/${staffId}`,
    revalidatePaths: ["/admin/staff", `/admin/staff/${staffId}`],
  });
}

/**
 * Form-action wrapper for server-rendered assignment forms.
 */
export async function assignStaffServiceFormAction(
  staffId: string,
  formData: FormData,
) {
  const auth = await requireAuth();

  if (!auth.success) {
    return;
  }

  await assignStaffServiceAction(
    staffId,
    { message: "", success: false },
    formData,
  );
}

/**
 * Removes one assigned service from a staff profile.
 */
export async function removeStaffServiceAction(
  staffId: string,
  serviceId: string,
) {
  const auth = await requireAuth();

  if (!auth.success) {
    return;
  }

  const response = await handleRemoveStaffService(
    new Request(
      `http://nikharta-roop.local/api/v1/admin/staff/${staffId}/services/${serviceId}`,
      {
        headers: await createServerApiHeaders(),
        method: "DELETE",
      },
    ),
    staffId,
    serviceId,
  );

  await handleStaffActionResponse(response, {
    fallbackMessage: "Staff service removed.",
    redirectPath: `/admin/staff/${staffId}`,
    revalidatePaths: ["/admin/staff", `/admin/staff/${staffId}`],
  });
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
  input: {
    fallbackMessage: string;
    redirectPath: string;
    revalidatePaths: string[];
  },
) {
  const payload = (await response.json().catch(() => null)) as
    | StaffActionPayload
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
    .flatMap((part) => {
      const text = part.trim();

      return text ? [text] : [];
    });
}
