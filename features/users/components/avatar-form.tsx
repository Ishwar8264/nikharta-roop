"use client";

import * as React from "react";
import { LinkIcon } from "lucide-react";

import { InputField } from "@/components/ui/shared/input/generic-input";
import {
  removeAvatarAction,
  updateAvatarAction,
} from "@/features/users/actions/avatar.actions";
import { AvatarPreview } from "@/features/users/components/avatar-preview";
import { AvatarRemoveButton } from "@/features/users/components/avatar-remove-button";
import { AvatarSaveButton } from "@/features/users/components/avatar-save-button";
import { AvatarUploadField } from "@/features/users/components/avatar-upload-field";
import type { UserProfile } from "@/features/users/types/user-profile.types";

type AvatarFormProps = {
  user: UserProfile;
};

// URL-based avatar manager wired to POST/DELETE /users/me/avatar.
export function AvatarForm({ user }: AvatarFormProps) {
  const avatarUrlRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState(user.avatarUrl);
  const [saveState, saveAction] = React.useActionState(updateAvatarAction, {
    message: "",
    success: false,
  });
  const [removeState, removeAction] = React.useActionState(
    removeAvatarAction,
    { message: "", success: false },
  );

  return (
    <div className="space-y-4">
      <AvatarPreview avatarUrl={previewUrl} name={user.name} />

      <form action={saveAction} className="space-y-3">
        <AvatarUploadField
          onUploaded={(avatarUrl) => {
            setPreviewUrl(avatarUrl);

            if (avatarUrlRef.current) {
              avatarUrlRef.current.value = avatarUrl;
            }
          }}
        />

        <InputField
          ref={avatarUrlRef}
          name="avatarUrl"
          label="Avatar URL"
          defaultValue={user.avatarUrl ?? ""}
          placeholder="https://cdn.example.com/avatar.jpg"
          type="url"
          leftIcon={<LinkIcon className="size-4" />}
          inputClassName="h-11 rounded-xl bg-white"
          helperText="Cloudinary fills this after upload; HTTPS URL only."
        />
        <AvatarSaveButton />
        <AvatarMessage state={saveState} />
      </form>

      {user.avatarUrl ? (
        <form action={removeAction}>
          <AvatarRemoveButton />
          <AvatarMessage state={removeState} />
        </form>
      ) : null}
    </div>
  );
}

function AvatarMessage({
  state,
}: {
  state: { message: string; success: boolean };
}) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={state.success ? "text-sm text-green-700" : "text-sm text-destructive"}>
      {state.message}
    </p>
  );
}
