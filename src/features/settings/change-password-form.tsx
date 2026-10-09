"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { PasswordField } from "@/features/auth/shared/components/password-field";
import { ApiError } from "@/lib/api/backend.client";

import { changePasswordApi } from "./api";

/**
 * Browser-side mirror of `changePasswordSchema`.
 *
 * Why the client-side refine:
 * The server only checks that the new password meets the length rule. The
 * "new must differ from current" rule is enforced by the server too, but
 * surfacing it client-side first avoids a round trip and gives the user
 * immediate feedback. The server is still the source of truth.
 */
const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(128, "Password must contain at most 128 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from your current one",
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

/**
 * Change-password form.
 *
 * On success the server rotates the session cookies (every old refresh token
 * is revoked and this device receives a new pair). We just toast and reset
 * the form — no redirect needed because the new access cookie keeps the
 * caller signed in on this device.
 */
export function ChangePasswordForm() {
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setBusy(true);
    setFormMessage(null);
    try {
      await changePasswordApi({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated. Other devices were signed out.");
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
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Choose a strong password you do not use anywhere else. Changing it
          signs out every other device signed into your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <PasswordField
            id="currentPassword"
            label="Current password"
            autoComplete="current-password"
            placeholder="Your current password"
            error={errors.currentPassword?.message}
            disabled={busy}
          />
          <PasswordField
            id="newPassword"
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.newPassword?.message}
            disabled={busy}
          />
          <Field
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter the new password"
            error={errors.confirmPassword?.message}
            disabled={busy}
            {...register("confirmPassword")}
          />
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <FormError>{formMessage}</FormError>
          <Button type="submit" disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
