"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SALON_STATUSES, SALON_STATUS_LABELS, type SalonStatus } from "../status";
import { routes } from "@/config/routes";
import { ApiError } from "@/lib/api/backend.client";

import { addSalonMemberApi, deleteSalonApi, listSalonMembersApi, removeSalonMemberApi, updateSalonApi, type SalonMember } from "../api/manage";
import type { PublicSalon } from "../types";

interface Props {
  salon: PublicSalon & { viewerRole: "OWNER" | "MANAGER" | "STAFF" };
  currentUserId: string;
  verification: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED" | null;
}

type EditableField = "coverImage" | "bannerImage" | "name" | "shortDescription" | "address" | "city" | "state" | "zip" | "phone" | "email";

const fields: { key: EditableField; label: string; required?: boolean }[] = [
  { key: "name", label: "Name", required: true },
  { key: "shortDescription", label: "Short description" },
  { key: "address", label: "Address", required: true },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State", required: true },
  { key: "zip", label: "ZIP", required: true },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "coverImage", label: "Cover image URL" },
  { key: "bannerImage", label: "Banner image URL" },
];

/** Connects salon editing and owner-only roster actions to their API routes. */
export function SalonManagement({ salon, currentUserId, verification }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<SalonStatus>(salon.status);
  const isOwner = salon.viewerRole === "OWNER";
  const [values, setValues] = useState<Record<EditableField, string>>({
    name: salon.name,
    shortDescription: salon.shortDescription ?? "",
    address: salon.address,
    city: salon.city,
    state: salon.state,
    zip: salon.zip,
    phone: salon.phone ?? "",
    email: salon.email ?? "",
    coverImage: salon.coverImage ?? "",
    bannerImage: salon.bannerImage ?? "",
  });
  const [members, setMembers] = useState<SalonMember[]>([]);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<SalonMember["role"]>("STAFF");

  useEffect(() => {
    const controller = new AbortController();
    listSalonMembersApi(salon.id)
      .then((response) => {
        if (!controller.signal.aborted) setMembers(response.data);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setMemberError(errorMessage(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingMembers(false);
      });
    return () => controller.abort();
  }, [salon.id]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const changes: Partial<PublicSalon> = {};
    if (status !== salon.status) changes.status = status;
    for (const { key } of fields) {
      const next = values[key].trim();
      if (next !== (salon[key] ?? "")) {
        // Empty optional values intentionally clear the stored value.
        Object.assign(changes, { [key]: next || null });
      }
    }
    if (Object.keys(changes).length === 0) return;
    setBusy(true);
    try {
      const response = await updateSalonApi(salon.id, changes);
      setStatus(response.data.salon.status);
      setNotice(response.message);
      router.refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMemberError(null);
    setBusy(true);
    try {
      const response = await addSalonMemberApi(salon.id, { userId: userId.trim(), role });
      setMembers((current) => [...current, response.data.member]);
      setUserId("");
    } catch (reason) {
      setMemberError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!window.confirm("Remove this salon member?")) return;
    setMemberError(null);
    setBusy(true);
    try {
      await removeSalonMemberApi(salon.id, memberId);
      setMembers((current) => current.filter((member) => member.id !== memberId));
    } catch (reason) {
      setMemberError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  async function deleteSalon() {
    if (!window.confirm(`Delete ${salon.name}? This will remove it from the public directory.`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteSalonApi(salon.id);
      router.push(routes.salons);
      router.refresh();
    } catch (reason) {
      setError(errorMessage(reason));
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="mt-4 font-heading text-3xl font-semibold">Manage {salon.name}</h1>
      </header>

      <form onSubmit={save} className="space-y-5 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">Salon details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ key, label, required }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`salon-${key}`}>{label}</Label>
              <Input id={`salon-${key}`} value={values[key]} required={required} disabled={busy} type={key === "coverImage" || key === "bannerImage" ? "url" : key === "email" ? "email" : key === "phone" ? "tel" : "text"} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} />
            </div>
          ))}
        </div>
        <div className="space-y-2 rounded-xl border p-4">
          <Label id="salon-status-label" htmlFor="salon-status">Salon status</Label>
          <Select aria-labelledby="salon-status-label" value={status} onValueChange={(next) => { if (SALON_STATUSES.includes(next as SalonStatus)) setStatus(next as SalonStatus); }}>
            <SelectTrigger id="salon-status" disabled={busy} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{SALON_STATUSES.map((option) => <SelectItem key={option} value={option} disabled={verification !== "VERIFIED" && (option === "LIVE" || option === "TEMPORARILY_CLOSED")}>{SALON_STATUS_LABELS[option]}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{verification !== "VERIFIED" ? "Your salon stays hidden until verification is approved." : status === "LIVE" ? "Your salon is public and accepts new bookings." : status === "TEMPORARILY_CLOSED" ? "Your public page stays visible. New bookings are disabled." : status === "ARCHIVED" ? "Hidden from customers. Records and management access remain available; you can restore it later." : "Hidden from customers until you go live."}</p>
          {verification !== "VERIFIED" ? <p className="text-xs text-muted-foreground">Complete verification before going live.</p> : null}
        </div>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {notice ? <p role="status" className="text-sm text-primary">{notice}</p> : null}
        <Button type="submit" disabled={busy}>Save changes</Button>
      </form>

      <section className="space-y-5 rounded-xl border p-6" aria-labelledby="members-heading">
        <h2 id="members-heading" className="text-xl font-semibold">Members</h2>
        {loadingMembers ? <p role="status">Loading members…</p> : null}
        {memberError ? <p role="alert" className="text-sm text-destructive">{memberError}</p> : null}
        {!loadingMembers && members.length === 0 && !memberError ? <p className="text-sm text-muted-foreground">No members found.</p> : null}
        <ul className="divide-y">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{member.user.name || member.user.email || member.userId}</p>
                <p className="text-sm text-muted-foreground">{member.role} · {member.user.email}</p>
              </div>
              {isOwner && member.userId !== currentUserId ? <Button type="button" variant="destructive" disabled={busy} onClick={() => removeMember(member.id)}>Remove</Button> : null}
            </li>
          ))}
        </ul>
        {isOwner ? (
          <form onSubmit={addMember} className="flex flex-wrap items-end gap-3 border-t pt-5">
            <div className="min-w-52 flex-1 space-y-2">
              <Label htmlFor="member-user-id">Existing user ID</Label>
              <Input id="member-user-id" value={userId} onChange={(event) => setUserId(event.target.value)} required disabled={busy} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <select id="member-role" className="h-8 rounded-lg border bg-background px-2 text-sm" value={role} onChange={(event) => setRole(event.target.value as SalonMember["role"])} disabled={busy}>
                <option value="STAFF">Staff</option><option value="MANAGER">Manager</option><option value="OWNER">Owner</option>
              </select>
            </div>
            <Button type="submit" disabled={busy}>Add member</Button>
          </form>
        ) : null}
      </section>

      {isOwner ? <section className="space-y-3 rounded-xl border border-destructive/40 p-6"><h2 className="text-xl font-semibold">Delete salon</h2><Button type="button" variant="destructive" disabled={busy} onClick={deleteSalon}>Delete salon</Button></section> : null}
    </main>
  );
}

function errorMessage(reason: unknown): string {
  return reason instanceof ApiError ? reason.message : "Something went wrong. Please try again.";
}
