/**
 * Purpose: Server actions for admin branch management forms.
 * Responsibilities: authenticate action calls, translate FormData, and redirect after successful branch writes.
 * Important notes: branch API handlers still own validation, role checks, and branch persistence.
 */
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/features/api/server-action-auth";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleCreateBranch,
  handleUpdateBranch,
} from "@/features/branches/handlers/branch.handlers";
import { toBranchBody } from "@/features/branches/helpers/branch-form-data";

export type BranchActionState = {
  message: string;
  success: boolean;
};

type BranchActionPayload = {
  message?: string;
  success?: boolean;
};

/**
 * Creates a branch through POST /api/v1/admin/branches after confirming a session exists.
 */
export async function createBranchAction(
  _previousState: BranchActionState,
  formData: FormData,
): Promise<BranchActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleCreateBranch(
    new Request("http://nikharta-roop.local/api/v1/admin/branches", {
      body: JSON.stringify(toBranchBody(formData)),
      headers: await createServerApiHeaders(),
      method: "POST",
    }),
  );

  return handleBranchActionResponse(response, "Branch created.");
}

/**
 * Updates a branch through PATCH /api/v1/admin/branches/:branchId after auth.
 */
export async function updateBranchAction(
  branchId: string,
  _previousState: BranchActionState,
  formData: FormData,
): Promise<BranchActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleUpdateBranch(
    new Request(`http://nikharta-roop.local/api/v1/admin/branches/${branchId}`, {
      body: JSON.stringify(toBranchBody(formData)),
      headers: await createServerApiHeaders(),
      method: "PATCH",
    }),
    branchId,
  );

  return handleBranchActionResponse(response, "Branch updated.");
}

/**
 * Converts API success into cache invalidation plus redirect, or preserves errors for the form.
 */
async function handleBranchActionResponse(
  response: Response,
  fallbackMessage: string,
) {
  const payload = (await response.json().catch(() => null)) as
    | BranchActionPayload
    | null;

  if (response.ok && payload?.success === true) {
    revalidatePath("/admin/branches");
    redirect("/admin/branches");
  }

  return {
    message: payload?.message ?? fallbackMessage,
    success: false,
  };
}
