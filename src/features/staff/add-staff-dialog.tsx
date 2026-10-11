"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/auth/shared/components/field";
import { MediaPickerDialog } from "@/features/media";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";
import { addSalonMemberApi, type SalonMember } from "@/features/salon/api/manage";

interface Props {
  salonId: string;
  salonSlug: string;
  onAdded?: (member: SalonMember) => void;
}

/** Reuses profile fields and media selection while saving only the salon identity. */
export function AddStaffDialog({ salonId, salonSlug, onAdded }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<"STAFF" | "MANAGER">("STAFF");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await addSalonMemberApi(salonId, {
        name: name.trim(), email: email.trim(), avatar,
        title: title.trim() || null, description: description.trim() || null, role,
      });
      const member = response.data.member;
      onAdded?.(member);
      setOpen(false);
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
    <Dialog open={open} onOpenChange={(next) => {
      if (busy) return;
      setOpen(next);
      if (next) {
        setName(""); setEmail(""); setAvatar(null); setTitle(""); setDescription(""); setRole("STAFF"); setError(null);
      }
    }}>
      <DialogTrigger>Add staff</DialogTrigger>
      <DialogContent showCloseButton={!busy} className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add staff</DialogTitle>
          <DialogDescription>Create their salon profile. New accounts receive an email to verify and choose their own password.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {avatar ? <AvatarImage src={avatar} alt={name || "Staff photo"} /> : null}
              <AvatarFallback>{name.trim()[0]?.toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <MediaPickerDialog title="Choose staff photo" mode="single" max={1} maxSizeMB={5} disabled={busy}
              value={avatar ? [{ url: avatar, publicId: avatar }] : []}
              onChange={(images) => setAvatar(images[0]?.url ?? null)}
              trigger={<Button type="button" variant="outline" disabled={busy}>Choose photo</Button>} />
            {avatar ? <Button type="button" variant="ghost" disabled={busy} onClick={() => setAvatar(null)}>Remove</Button> : null}
          </div>
          <Field id="staff-name" label="Name" minLength={2} maxLength={100} required disabled={busy} value={name} onChange={(event) => setName(event.target.value)} />
          <Field id="staff-email" label="Email" type="email" autoComplete="email" maxLength={254} required disabled={busy} value={email} onChange={(event) => setEmail(event.target.value)} description="An existing account is linked automatically. Personal account details stay unchanged." />
          <Field id="staff-title" label="Professional title (optional)" placeholder="Hair stylist" maxLength={100} disabled={busy} value={title} onChange={(event) => setTitle(event.target.value)} />
          <div className="space-y-2">
            <Label htmlFor="staff-description">Description (optional)</Label>
            <Textarea id="staff-description" maxLength={500} rows={3} disabled={busy} value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role">Salon role</Label>
            <select id="staff-role" className="h-9 w-full rounded-lg border bg-background px-3" disabled={busy} value={role} onChange={(event) => setRole(event.target.value as "STAFF" | "MANAGER")}>
              <option value="STAFF">Staff</option><option value="MANAGER">Manager</option>
            </select>
            {role === "MANAGER" ? <p className="text-sm text-muted-foreground">Managers can access bookings and customer information after verification.</p> : null}
          </div>
          <p className="text-xs text-muted-foreground">Unverified staff cannot access salon management or receive bookings. You can configure services and hours while verification is pending.</p>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add staff"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
