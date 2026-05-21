/**
 * Purpose: Server actions for current-user avatar updates.
 * Responsibilities: authenticate action calls, forward avatar mutations to API handlers, and refresh profile routes.
 * Important notes: external media deletion is handled separately from clearing the stored avatar URL.
 */
"use server";

import { revalidatePath } from "next/cache";

import { requireAuth } from "@/features/api/server-action-auth";
import { createServerApiHeaders } from "@/features/api/server-api-headers";
import {
  handleRemoveAvatar,
  handleUpdateAvatar,
} from "@/features/users/handlers/user.handlers";
import type { ProfileActionState } from "@/features/users/types/user-profile.types";

type AvatarPayload = {
  message?: string;
  success?: boolean;
};

/**
 * Saves an already uploaded HTTPS avatar URL through the avatar API.
 */
export async function updateAvatarAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await callAvatarHandler(handleUpdateAvatar, "POST", {
    avatarUrl: getFormString(formData, "avatarUrl"),
  });

  return toAvatarState(response, "Could not update avatar.");
}

/**
 * Removes only the saved URL; external storage cleanup is handled separately.
 */
export async function removeAvatarAction(
  previousState: ProfileActionState,
): Promise<ProfileActionState> {
  void previousState;

  const auth = await requireAuth();

  if (!auth.success) {
    return { message: auth.message, success: false };
  }

  const response = await callAvatarHandler(handleRemoveAvatar, "DELETE");

  return toAvatarState(response, "Could not remove avatar.");
}

/**
 * Calls one avatar route handler with current request cookies and audit headers.
 */
async function callAvatarHandler(
  handler: (request: Request) => Promise<Response>,
  method: "DELETE" | "POST",
  body?: Record<string, string>,
) {
  return handler(
    new Request("http://nikharta-roop.local/api/v1/users/me/avatar", {
      body: body ? JSON.stringify(body) : undefined,
      headers: await createServerApiHeaders(),
      method,
    }),
  );
}

/**
 * Converts the avatar API response into form state and refreshes profile screens.
 */
async function toAvatarState(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as
    | AvatarPayload
    | null;

  if (response.ok && payload?.success === true) {
    revalidatePath("/account");
    revalidatePath("/account/profile");
    revalidatePath("/account/profile/edit");
  }

  return {
    message: payload?.message ?? fallbackMessage,
    success: response.ok && payload?.success === true,
  };
}

/**
 * Reads avatar form values defensively as trimmed strings.
 */
function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
