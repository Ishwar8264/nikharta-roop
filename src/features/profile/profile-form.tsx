"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Check, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { updateProfileApi } from "./api";
import type { UserProfile, UpdateProfileBody } from "./types";

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
  initial: UserProfile;
}

/** Edits the customer's profile with a live preview and reset to the last save. */
export function ProfileForm({ initial }: ProfileFormProps) {
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    control,
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

  const nameValue = useWatch({ control, name: "name" });
  const avatarUrl = useWatch({ control, name: "avatar" });
  const bioValue = useWatch({ control, name: "bio" }) ?? "";
  const displayName = nameValue.trim() || "Your name";
  const initials = nameValue.trim().split(/\s+/).slice(0, 2)
    .map((part) => part.charAt(0)).join("").toUpperCase() || "?";

  function handlePickerChange(next: UploadedImage[]) {
    setValue("avatar", next[0]?.url ?? null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleReset() {
    // RHF's defaults are updated after each successful save.
    reset();
    setFormMessage(null);
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
      // Refresh server-rendered account surfaces, including the header avatar.
      router.replace(routes.profile);
      router.refresh();
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
    <Card className="rounded-2xl" data-form-rounded="true">
      <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={busy}>
        <fieldset disabled={busy} className="min-w-0 space-y-6">
          <div className="border-b bg-primary/5 px-5 py-6 sm:px-7 sm:py-8">
            <div className="flex items-center gap-4 sm:gap-5">
              <Avatar size="lg" className="size-20 ring-4 ring-background sm:size-24">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile photo" /> : null}
                <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-widest text-primary">
                  Your profile
                </p>
                <h2 className="mt-1 break-words text-2xl font-semibold sm:text-3xl">
                  {displayName}
                </h2>
                <p className="mt-2 line-clamp-2 break-words text-sm text-muted-foreground">
                  {bioValue.trim() || "Make it yours with a photo and a little about yourself."}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <MediaPickerDialog
                title="Choose profile photo"
                description="Upload a photo or choose one from your library."
                value={avatarUrl ? [{ url: avatarUrl, publicId: avatarUrl }] : []}
                onChange={handlePickerChange}
                mode="single"
                max={1}
                disabled={busy}
                trigger={
                  <Button type="button" variant="outline" className="h-10" disabled={busy}>
                    <Camera aria-hidden="true" />
                    {avatarUrl ? "Change photo" : "Upload photo"}
                  </Button>
                }
              />
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 text-muted-foreground"
                  onClick={() => handlePickerChange([])}
                >
                  <Trash2 aria-hidden="true" />
                  Remove photo
                </Button>
              ) : null}
            </div>
            {errors.avatar ? (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {errors.avatar.message}
              </p>
            ) : null}
          </div>

          <CardHeader className="px-5 sm:px-7">
            <CardTitle>Personal details</CardTitle>
            <CardDescription>
              Keep your name and photo easy for your salon to recognise.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-5 pb-6 sm:px-7">
            <Field
              id="name"
              label="Full name"
              placeholder="Enter your name"
              description="Use the name you book your appointments with."
              error={errors.name?.message}
              autoComplete="name"
              {...register("name")}
            />
            <div className="space-y-2">
              <Label htmlFor="bio">
                About you <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="bio"
                placeholder="A little about you or your style preferences"
                rows={4}
                className="min-h-28 resize-y"
                {...register("bio")}
                aria-invalid={errors.bio ? true : undefined}
                aria-describedby="bio-help bio-count"
              />
              <div className="flex items-start justify-between gap-3 text-xs">
                <p
                  id="bio-help"
                  className={cn("text-muted-foreground", errors.bio && "text-destructive")}
                >
                  {errors.bio?.message ?? "Share a little about yourself. Up to 500 characters."}
                </p>
                <p id="bio-count" className="shrink-0 text-muted-foreground tabular-nums">
                  {bioValue.length}/500
                </p>
              </div>
            </div>
            <FormError>{formMessage}</FormError>
          </CardContent>
        </fieldset>
        <CardFooter className="flex-col items-stretch gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
            {!isDirty && !busy ? <Check className="size-4" aria-hidden="true" /> : null}
            {busy ? "Saving your profile…" : isDirty ? "You have unsaved changes" : "Your profile is up to date"}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={busy || !isDirty}
              className="h-11 flex-1 sm:flex-none"
            >
              Reset
            </Button>
            <Button type="submit" disabled={busy || !isDirty} className="h-11 flex-1 px-5 sm:flex-none">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
