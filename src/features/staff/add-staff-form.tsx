"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { ImagePlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { FormHeader, SelectField } from "@/components/shared";
import { FormError } from "@/features/auth/shared/components/form-error";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/auth/shared/components/field";
import { MediaPickerDialog } from "@/features/media";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";
import { slugify } from "@/features/salon/schemas";
import type { PublicStaffMember } from "./types";
import { addSalonMemberApi, updateSalonMemberApi } from "@/features/salon/api/manage";

interface Props {
  salonId: string;
  salonSlug: string;
  salonName: string;
  member?: PublicStaffMember;
}

const staffFormSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
  slug: z.string().trim().min(2, "Enter a slug with at least 2 characters.").max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.")
    .refine((value) => value !== "create" && !/^[a-f0-9]{48}$/.test(value) && !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value), "Choose a different slug."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254)),
  title: z.string().trim().max(100),
  description: z.string().trim().max(500),
  role: z.enum(["STAFF", "MANAGER"]),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

/** Creates or edits a salon profile while preserving account identity and membership role. */
export function AddStaffForm({ salonId, salonSlug, salonName, member }: Props) {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(member?.avatar ?? null);
  const [bannerImage, setBannerImage] = useState<string | null>(member?.bannerImage ?? null);
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(member));
  const { register, control, handleSubmit, setValue, clearErrors, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(member ? staffFormSchema.extend({ email: z.string() }) : staffFormSchema),
    defaultValues: { name: member?.name ?? member?.user.name ?? "", slug: member?.slug ?? "", email: member?.user.email ?? "", title: member?.title ?? "", description: member?.description ?? "", role: member?.role === "MANAGER" ? "MANAGER" : "STAFF" },
    mode: "onTouched",
  });
  const name = useWatch({ control, name: "name" });
  // Follow the name until the user chooses a custom URL.
  useEffect(() => {
    if (!slugWasEdited) {
      setValue("slug", slugify(name), { shouldValidate: false });
      clearErrors("slug");
    }
  }, [name, slugWasEdited, setValue, clearErrors]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: StaffFormValues) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (member) {
        const response = await updateSalonMemberApi(salonId, member.id, {
          name: values.name, slug: values.slug, title: values.title || null,
          description: values.description || null, avatar, bannerImage,
        });
        toast.success("Staff profile updated.");
        router.push(routes.salonStaffDetail(salonSlug, response.data.member.slug ?? member.id));
        router.refresh();
        return;
      }
      const response = await addSalonMemberApi(salonId, {
        ...values, avatar, bannerImage,
        title: values.title || null, description: values.description || null,
      });
      const createdMember = response.data.member;
      if (createdMember.verificationEmailSent === false) {
        toast.warning("Staff added. Verification email could not be sent; resend it from their profile.");
      } else {
        toast.success(createdMember.user.emailVerified ? "Staff added." : "Staff added. Email verification is pending.");
      }
      router.push(routes.salonStaffDetail(salonSlug, createdMember.slug ?? createdMember.id));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Unable to save staff. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} data-form-rounded="true" noValidate>
      <Card className="gap-0 overflow-visible py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-8 sm:py-6">
          <FormHeader title={member ? "Edit staff" : "Add staff"} description={salonName} />
        </CardHeader>
        <CardContent className="space-y-6 px-5 py-5 sm:px-8">
          <FormError>{error}</FormError>
          <section className="space-y-4" aria-labelledby="staff-profile-heading">
            <h2 id="staff-profile-heading" className="sr-only">Staff profile</h2>
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field id="staff-name" label="Name" placeholder="Priya Sharma" autoComplete="name" maxLength={100} required disabled={busy} error={errors.name?.message} {...register("name")} />
              <Field id="staff-slug" label="Slug" placeholder="priya-sharma" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={80} required disabled={busy} error={errors.slug?.message} {...register("slug", { onChange: () => setSlugWasEdited(true) })} />
              <Field id="staff-email" label="Email" type="email" placeholder="priya@example.com" autoComplete="email" maxLength={254} required={!member} readOnly={Boolean(member)} disabled={busy} error={errors.email?.message} {...register("email")} />
              {member ? <Field id="staff-role" label="Salon role" value={member.role === "OWNER" ? "Owner" : member.role === "MANAGER" ? "Manager" : "Staff"} readOnly disabled={busy} /> : <Controller name="role" control={control} render={({ field }) => (
                <SelectField id="staff-role" label="Salon role" value={field.value} onValueChange={(value) => { if (value) field.onChange(value); }}
                  options={[{ value: "STAFF", label: "Staff" }, { value: "MANAGER", label: "Manager" }]}
                  disabled={busy} error={errors.role?.message} triggerProps={{ onBlur: field.onBlur, ref: field.ref }}
                />
              )} />}
            </div>
            <Field id="staff-title" label="Professional title (optional)" placeholder="Hair stylist" maxLength={100} disabled={busy} error={errors.title?.message} {...register("title")} />
            <div className="space-y-1.5">
              <Label htmlFor="staff-description">Description (optional)</Label>
              <Textarea id="staff-description" placeholder="Share their expertise and experience" maxLength={500} rows={3} disabled={busy} aria-invalid={errors.description ? true : undefined} aria-describedby={errors.description ? "staff-description-error" : undefined} {...register("description")} />
              {errors.description ? <p id="staff-description-error" className="text-xs text-destructive">{errors.description.message}</p> : null}
            </div>
            {!member ? <p className="text-xs text-muted-foreground">New members receive a verification email.</p> : null}
            <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
              {[
                { label: "Profile photo", title: "Choose staff photo", value: avatar, setValue: setAvatar },
                { label: "Banner image", title: "Choose staff banner", value: bannerImage, setValue: setBannerImage },
              ].map(({ label, title, value, setValue }) => (
                <div key={label} className="space-y-2">
                  <p className="text-sm font-medium">{label} <span className="font-normal text-muted-foreground">(optional)</span></p>
                  <MediaPickerDialog
                    title={title}
                    mode="single"
                    max={1}
                    maxSizeMB={5}
                    disabled={busy}
                    value={value ? [{ url: value, publicId: value }] : []}
                    onChange={(images) => setValue(images[0]?.url ?? null)}
                    trigger={
                      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center transition-colors hover:border-primary/50 hover:bg-muted/40">
                        {value ? (
                          <Image src={value} alt={label} fill sizes="(max-width: 640px) 100vw, 350px" className={label === "Profile photo" ? "object-contain" : "object-cover"} />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
                            <span className="text-sm font-medium">Add image</span>
                          </div>
                        )}
                      </div>
                    }
                  />
                  <div className="flex items-start justify-between gap-2">
                    {value ? <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setValue(null)} aria-label={`Remove ${label.toLowerCase()}`} className="h-auto shrink-0 px-1 py-0 text-xs text-muted-foreground">Remove</Button> : null}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Images are optional · Up to 5 MB each.</p>
          </section>

        </CardContent>
        <CardFooter className="flex flex-col-reverse items-stretch gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <Button type="button" variant="outline" disabled={busy} render={<Link href={(member ? routes.salonStaffDetail(salonSlug, member.slug ?? member.id) : routes.salonStaff(salonSlug))} />}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}{busy ? "Saving…" : member ? "Save changes" : "Add staff"}</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
