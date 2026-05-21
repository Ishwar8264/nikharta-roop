/**
 * Purpose: Server actions for current-user profile edits.
 * Responsibilities: authenticate profile updates, forward patches to API handlers, and refresh account routes.
 * Important notes: mobile, role, and auth token fields are intentionally not accepted from the form.
 */
"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/features/api/server-action-auth";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import { handleUpdateProfile } from "@/features/users/handlers/user.handlers";
import type { ProfileActionState } from "@/features/users/types/user-profile.types";

type ProfilePayload = {
  message?: string;
  success?: boolean;
};

const EMPTY_BRANCH_VALUE = "__none__";

/**
 * Sends profile form changes through PATCH /api/v1/users/me/profile after auth.
 */
export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await handleUpdateProfile(
    new Request("http://nikharta-roop.local/api/v1/users/me/profile", {
      body: JSON.stringify(toProfilePatchBody(formData)),
      headers: await createServerApiHeaders(),
      method: "PATCH",
    }),
  );
  const payload = (await response.json().catch(() => null)) as
    | ProfilePayload
    | null;

  if (response.ok && payload?.success === true) {
    revalidatePath("/account");
    revalidatePath("/account/profile");
    revalidatePath("/account/profile/edit");
  }

  return {
    message: payload?.message ?? "Could not update profile.",
    success: response.ok && payload?.success === true,
  };
}

/**
 * Keeps form parsing small and aligned with the profile API schema.
 */
function toProfilePatchBody(formData: FormData) {
  const branchId = getFormString(formData, "branchId");

  return {
    branchId: branchId === EMPTY_BRANCH_VALUE ? "" : branchId,
    email: getFormString(formData, "email"),
    name: getFormString(formData, "name"),
  };
}

/**
 * Reads profile form values defensively as trimmed strings.
 */
function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
