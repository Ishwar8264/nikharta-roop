"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";
import { addSalonMemberApi } from "@/features/salon/api/manage";

interface Props {
  salonId: string;
  salonSlug: string;
  salonName: string;
}

const staffFormSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254)),
  title: z.string().trim().max(100),
  description: z.string().trim().max(500),
  role: z.enum(["STAFF", "MANAGER"]),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

/** Creates a salon profile using the existing membership and verification flow. */
export function AddStaffForm({ salonId, salonSlug, salonName }: Props) {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);
  const { register, control, handleSubmit, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: { name: "", email: "", title: "", description: "", role: "STAFF" },
    mode: "onTouched",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(values: StaffFormValues) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await addSalonMemberApi(salonId, {
        ...values, avatar,
        title: values.title || null, description: values.description || null,
      });
      const member = response.data.member;
      if (member.verificationEmailSent === false) {
        toast.warning("Staff added. Verification email could not be sent; resend it from their profile.");
      } else {
        toast.success(member.user.emailVerified ? "Staff added." : "Staff added. Email verification is pending.");
      }
      router.push(routes.salonStaffDetail(salonSlug, member.id));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Unable to add staff. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} data-form-rounded="true" noValidate>
      <Card className="gap-0 overflow-visible py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-8 sm:py-6">
          <FormHeader title="Add staff" description={`Create a team profile for ${salonName}. New accounts receive an email to verify and choose their own password.`} />
        </CardHeader>
        <CardContent className="space-y-8 px-5 py-6 sm:space-y-10 sm:px-8">
          <FormError>{error}</FormError>
          <section className="space-y-4" aria-labelledby="staff-profile-heading">
            <div className="space-y-1">
              <h2 id="staff-profile-heading" className="text-base font-semibold">Staff profile</h2>
              <p className="text-sm text-muted-foreground">Add their photo and the details shown on their salon profile.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 p-4">
              <Avatar size="lg">
                {avatar ? <AvatarImage src={avatar} alt="Staff photo" /> : null}
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap items-center gap-2">
                <MediaPickerDialog title="Choose staff photo" mode="single" max={1} maxSizeMB={5} disabled={busy}
                  value={avatar ? [{ url: avatar, publicId: avatar }] : []}
                  onChange={(images) => setAvatar(images[0]?.url ?? null)}
                  trigger={<Button type="button" variant="outline" disabled={busy}>Choose photo</Button>} />
                {avatar ? <Button type="button" variant="ghost" disabled={busy} onClick={() => setAvatar(null)}>Remove</Button> : null}
              </div>
              <p className="w-full text-xs text-muted-foreground">Optional · JPG, PNG, WebP or AVIF · Up to 5 MB.</p>
            </div>
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field id="staff-name" label="Name" placeholder="e.g. Priya Sharma" autoComplete="name" maxLength={100} required disabled={busy} error={errors.name?.message} {...register("name")} />
              <Field id="staff-email" label="Email" type="email" placeholder="e.g. priya@example.com" autoComplete="email" maxLength={254} required disabled={busy} error={errors.email?.message} {...register("email")} />
            </div>
            <p className="text-xs text-muted-foreground">An existing account is linked automatically. Personal account details stay unchanged.</p>
            <Field id="staff-title" label="Professional title (optional)" placeholder="Hair stylist" maxLength={100} disabled={busy} error={errors.title?.message} {...register("title")} />
            <div className="space-y-1.5">
              <Label htmlFor="staff-description">Description (optional)</Label>
              <Textarea id="staff-description" placeholder="Share their expertise and experience" maxLength={500} rows={4} disabled={busy} aria-invalid={errors.description ? true : undefined} aria-describedby={errors.description ? "staff-description-error" : undefined} {...register("description")} />
              {errors.description ? <p id="staff-description-error" className="text-xs text-destructive">{errors.description.message}</p> : null}
            </div>
          </section>
          <section className="space-y-4" aria-labelledby="staff-access-heading">
            <h2 id="staff-access-heading" className="text-base font-semibold">Salon access</h2>
            <Controller name="role" control={control} render={({ field }) => (
              <SelectField id="staff-role" label="Salon role" value={field.value} onValueChange={(value) => { if (value) field.onChange(value); }}
                options={[{ value: "STAFF", label: "Staff" }, { value: "MANAGER", label: "Manager" }]}
                disabled={busy} error={errors.role?.message} triggerProps={{ onBlur: field.onBlur, ref: field.ref }}
                description={field.value === "MANAGER" ? "Managers can access bookings and customer information after verification." : "Staff can manage their assigned work after verification."} />
            )} />
            <p className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">Unverified staff cannot access salon management or receive bookings. You can configure services and hours while verification is pending.</p>
          </section>
        </CardContent>
        <CardFooter className="flex flex-col-reverse items-stretch gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <Button type="button" variant="outline" disabled={busy} render={<Link href={routes.salonStaffManage(salonSlug)} />}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}{busy ? "Adding…" : "Add staff"}</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
