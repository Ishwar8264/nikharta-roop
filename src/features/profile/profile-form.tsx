"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaPickerDialog } from "@/features/media";
import type { UploadedImage } from "@/features/media";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { updateProfileApi } from "./api";
import type { CurrentUserWire, UpdateProfileBody } from "./types";

/**
 * Browser-side mirror of `updateProfileSchema`.
 *
 * Why a copy instead of importing the server schema:
 * `src/server/modules/auth/auth.schema.ts` is fine to import into a Client
 * Component (it has no `"server-only"` marker and only depends on `zod`), but
 * the rest of the auth module *is* server-only. Importing the schema pulls
 * the rest of the module graph through the bundler. A tiny mirror keeps the
 * client bundle honest.
 *
 * The refine guards against an empty body the same way the server does; the
 * form disables submit when `!isDirty` so the guard is a defensive backstop.
 */
const profileFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100, "Name must contain at most 100 characters"),
    avatar: z
      .string()
      .trim()
      .url("Avatar must be a valid URL")
      .max(2048, "Avatar URL is too long")
      .nullable(),
    bio: z
      .string()
      .trim()
      .max(500, "Bio must contain at most 500 characters")
      .nullable(),
  })
  .refine(
    (value) =>
      value.name !== "" || value.avatar !== null || value.bio !== null,
    { message: "At least one field must be provided" },
  );

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  initial: CurrentUserWire;
}

/**
 * Edit form for the customer's own profile.
 *
 * Why local state for the avatar URL (instead of RHF):
 * The media picker returns an `UploadedImage[]` (one or more). The form only
 * cares about a single URL string. Keeping a small `avatarUrl` state plus a
 * RHF `setValue` keeps the picker's multi-select API intact while the wire
 * body stays a single URL.
 */
export function ProfileForm({ initial }: ProfileFormProps) {
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial.avatar);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initial.name ?? "",
      avatar: initial.avatar,
      bio: initial.bio,
    },
  });

  // Sync the avatar URL into RHF state whenever the picker commits a new
  // selection. RHF does not know about the picker's internal state, so this
  // effect is the bridge. `avatarUrl` is the source of truth from the picker
  // side; `setValue("avatar", ...)` marks the field dirty so the Save button
  // enables.
  useEffect(() => {
    setValue("avatar", avatarUrl, { shouldDirty: true });
  }, [avatarUrl, setValue]);

  const bioValue = watch("bio") ?? "";

  function handlePickerChange(next: UploadedImage[]) {
    const first = next[0];
    setAvatarUrl(first ? first.url : null);
  }

  async function onSubmit(values: ProfileFormValues) {
    setBusy(true);
    setFormMessage(null);

    const body: UpdateProfileBody = {
      name: values.name,
      avatar: values.avatar,
      bio: values.bio,
    };

    try {
      const response = await updateProfileApi(body);
      const updated = response.data.user;
      reset({
        name: updated.name ?? "",
        avatar: updated.avatar,
        bio: updated.bio,
      });
      setAvatarUrl(updated.avatar);
      toast.success("Profile updated.");
    } catch (error) {
      if (error instanceof ApiError) {
        setFormMessage(error.message);
      } else {
        setFormMessage("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
        <CardDescription>
          Update how your name, photo, and bio appear across Nikharta Roop.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar size="lg" className="size-16">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                <AvatarFallback>
                  {(initial.name ?? "?").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <MediaPickerDialog
                title="Choose avatar"
                description="Pick one image from your library or upload a new one."
                value={avatarUrl ? [{ url: avatarUrl, publicId: avatarUrl }] : []}
                onChange={handlePickerChange}
                mode="single"
                max={1}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    {avatarUrl ? "Change avatar" : "Upload avatar"}
                  </Button>
                }
              />
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAvatarUrl(null)}
                  className="gap-1.5 text-muted-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <Field
            id="name"
            label="Name"
            placeholder="Your name"
            error={errors.name?.message}
            autoComplete="name"
            {...register("name")}
          />

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell salons a little about yourself"
              rows={4}
              {...register("bio")}
              aria-invalid={errors.bio ? true : undefined}
            />
            <div className="flex items-center justify-between text-xs">
              <p
                className={cn(
                  "text-muted-foreground",
                  errors.bio ? "text-destructive" : null,
                )}
              >
                {errors.bio?.message ?? "Up to 500 characters."}
              </p>
              <p className="text-muted-foreground tabular-nums">
                {bioValue.length}/500
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <FormError>{formMessage}</FormError>
          <Button type="submit" disabled={busy || !isDirty}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
