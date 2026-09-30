"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/backend.client";

import { createServiceCategoryApi } from "./api";

/** Lets SUPER_ADMIN users create categories with server messages intact. */
export function ServiceCategoryManager() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const response = await createServiceCategoryApi({
        name: name.trim(),
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        ...(icon.trim() ? { icon: icon.trim() } : {}),
      });
      setMessage(response.message);
      setName("");
      setSlug("");
      setIcon("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border p-5">
      <h2 className="text-xl font-semibold">Create category</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="category-name">Name</Label><Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} disabled={busy} /></div>
        <div className="space-y-2"><Label htmlFor="category-slug">Slug (optional)</Label><Input id="category-slug" value={slug} onChange={(event) => setSlug(event.target.value)} maxLength={80} disabled={busy} /></div>
        <div className="space-y-2"><Label htmlFor="category-icon">Icon (optional)</Label><Input id="category-icon" value={icon} onChange={(event) => setIcon(event.target.value)} maxLength={64} disabled={busy} /></div>
      </div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {message ? <p role="status" className="text-sm text-primary">{message}</p> : null}
      <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create category"}</Button>
    </form>
  );
}
