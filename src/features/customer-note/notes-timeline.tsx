"use client";

import { MessageSquareText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { createNoteApi, deleteNoteApi } from "./api";
import type { CustomerNote, NotesTimelineProps } from "./types";

/** Backend enforces a 2000-character ceiling on note bodies. */
const MAX_NOTE_LENGTH = 2000;

/** "12 Mar 2026, 4:30 PM" — matches the salon's `en-IN` locale conventions. */
const noteDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const DELETE_FORBIDDEN_MESSAGE = "You do not have permission to delete this note.";

/**
 * Staff-facing notes timeline (composer + list + delete).
 *
 * The server page preloads the current notes via `listCustomerNotes`; mutations
 * flow through the client API module and update local state immediately, then
 * `router.refresh()` re-syncs with the server so author/role changes can't
 * leave stale UI behind.
 */
export function NotesTimeline({
  salonSlug,
  customerId,
  initial,
  currentUserId,
  currentUserRole,
  customerName,
  customerAvatar,
}: NotesTimelineProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Newest first — the server already orders this way, but a fresh fetch from
  // `createNoteApi` would prepend, so we keep that invariant here too.
  const [notes, setNotes] = useState<CustomerNote[]>(initial);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const remaining = useMemo(() => MAX_NOTE_LENGTH - draft.length, [draft]);
  const canSave = draft.trim().length > 0 && draft.length <= MAX_NOTE_LENGTH && !isSaving;

  function canDelete(note: CustomerNote): boolean {
    return (
      note.author.id === currentUserId ||
      currentUserRole === "MANAGER" ||
      currentUserRole === "OWNER"
    );
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed.length > MAX_NOTE_LENGTH || isSaving) return;

    setIsSaving(true);
    try {
      const result = await createNoteApi(salonSlug, customerId, { note: trimmed });
      const created = result.data.note;
      setNotes((current) => [created, ...current]);
      setDraft("");
      toast.success("Note added.");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not add the note. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const noteId = pendingDeleteId;
    if (!noteId || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteNoteApi(salonSlug, customerId, noteId);
      setNotes((current) => current.filter((note) => note.id !== noteId));
      toast.success("Note deleted.");
      setPendingDeleteId(null);
      startTransition(() => router.refresh());
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        // Author-or-MANAGER guard fired on the server — surface the exact
        // message the wiring spec asks for so staff understand the rule.
        toast.error(DELETE_FORBIDDEN_MESSAGE);
      } else {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Could not delete the note. Please try again.",
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {customerName ? (
        <CustomerHeader name={customerName} avatar={customerAvatar} />
      ) : null}

      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={handleCreate}
        remaining={remaining}
        canSave={canSave}
        isSaving={isSaving}
      />

      {notes.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No notes yet"
          description="No notes for this customer yet. Add the first one above."
        />
      ) : (
        <ol className="space-y-4">
          {notes.map((note) => (
            <TimelineRow
              key={note.id}
              note={note}
              canDelete={canDelete(note)}
              onDelete={() => setPendingDeleteId(note.id)}
            />
          ))}
        </ol>
      )}

      <Dialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this note?</DialogTitle>
            <DialogDescription>
              The note will be removed permanently. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CustomerHeaderProps {
  name: string;
  avatar?: string;
}

/**
 * Identifying header shown above the composer when the page has resolved a
 * customer name. The avatar image is rendered when a URL is provided; the
 * initial is always rendered as the fallback so a broken or slow Cloudinary
 * URL never leaves an empty tile.
 */
function CustomerHeader({ name, avatar }: CustomerHeaderProps) {
  const trimmedName = name.trim();
  const displayName = trimmedName || "Customer";
  const initial = (trimmedName[0] ?? "?").toUpperCase();

  return (
    <header className="flex items-center gap-3 rounded-xl border bg-card p-4 ring-1 ring-foreground/5">
      <Avatar size="lg">
        {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Customer</p>
        <p className="truncate text-base font-medium">{displayName}</p>
      </div>
    </header>
  );
}

interface ComposerProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  remaining: number;
  canSave: boolean;
  isSaving: boolean;
}

function Composer({
  value,
  onChange,
  onSubmit,
  remaining,
  canSave,
  isSaving,
}: ComposerProps) {
  const overLimit = remaining < 0;
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border bg-card p-4 ring-1 ring-foreground/5"
    >
      <div className="space-y-2">
        <Label htmlFor="customer-note-composer">Add a note</Label>
        <Textarea
          id="customer-note-composer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="e.g. Allergic to ammonia color — always patch-test first."
          maxLength={MAX_NOTE_LENGTH}
          rows={3}
          disabled={isSaving}
          aria-describedby="customer-note-composer-count"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Visible to all staff of this salon.</span>
          <span
            id="customer-note-composer-count"
            className={cn(overLimit && "text-destructive")}
          >
            {remaining} characters left
          </span>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!canSave}>
          {isSaving ? "Adding…" : "Add note"}
        </Button>
      </div>
    </form>
  );
}

interface TimelineRowProps {
  note: CustomerNote;
  canDelete: boolean;
  onDelete: () => void;
}

function TimelineRow({ note, canDelete, onDelete }: TimelineRowProps) {
  const authorName = note.author.name?.trim() || "Staff member";
  const initial = (note.author.name?.trim()?.[0] ?? "?").toUpperCase();
  const createdAt = noteDateFormatter.format(new Date(note.createdAt));

  return (
    <li className="flex gap-3 rounded-xl border bg-card p-4 ring-1 ring-foreground/5">
      <Avatar size="sm">
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="text-sm font-medium">{authorName}</span>
          <time
            dateTime={note.createdAt}
            className="text-xs text-muted-foreground"
          >
            {createdAt}
          </time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm text-foreground">
          {note.note}
        </p>
      </div>
      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          aria-label="Delete note"
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : null}
    </li>
  );
}
