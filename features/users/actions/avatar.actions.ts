"use server";

import { revalidatePath } from "next/cache";

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

// Saves an already uploaded HTTPS avatar URL through the avatar API.
export async function updateAvatarAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const response = await callAvatarHandler(handleUpdateAvatar, "POST", {
    avatarUrl: getFormString(formData, "avatarUrl"),
  });

  return toAvatarState(response, "Could not update avatar.");
}

// Removes only the saved URL; external storage cleanup is handled separately.
export async function removeAvatarAction(
  previousState: ProfileActionState,
): Promise<ProfileActionState> {
  void previousState;

  const response = await callAvatarHandler(handleRemoveAvatar, "DELETE");

  return toAvatarState(response, "Could not remove avatar.");
}

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

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}
