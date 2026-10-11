"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";
import { addSalonMemberApi } from "@/features/salon/api/manage";

/** Adds a registered account, then opens its existing skills and schedule editor. */
export function AddStaffDialog({ salonId, salonSlug }: { salonId: string; salonSlug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STAFF" | "MANAGER">("STAFF");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await addSalonMemberApi(salonId, { email: email.trim(), role });
      setOpen(false);
      router.push(routes.salonStaffDetail(salonSlug, response.data.member.id));
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
      if (next) { setEmail(""); setRole("STAFF"); setError(null); }
    }}>
      <DialogTrigger>Add staff</DialogTrigger>
      <DialogContent showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Add staff</DialogTitle>
          <DialogDescription>Use their registered email. After adding them, assign services and working hours.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff-email">Registered email</Label>
            <Input id="staff-email" type="email" autoComplete="email" maxLength={254} required disabled={busy} value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-role">Salon role</Label>
            <select id="staff-role" className="h-9 w-full rounded-lg border bg-background px-3" disabled={busy} value={role} onChange={(event) => setRole(event.target.value as "STAFF" | "MANAGER")}>
              <option value="STAFF">Staff</option><option value="MANAGER">Manager</option>
            </select>
            {role === "MANAGER" ? <p className="text-sm text-muted-foreground">Managers can access salon management, including bookings and customer information.</p> : null}
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Confirm and add"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
