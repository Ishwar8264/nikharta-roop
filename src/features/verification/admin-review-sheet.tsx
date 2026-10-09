"use client";

import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

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

import { reviewVerificationApi } from "./api";
import type { SalonVerification } from "./api";

type Decision = "VERIFIED" | "REJECTED" | "SUSPENDED";

interface AdminReviewSheetProps {
  salon: { slug: string; name: string; city?: string | null };
  verification: SalonVerification;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Admin review dialog for one pending verification.
 *
 * Why a single dialog with three actions:
 * Each review is a binary decision ("make this salon live" vs. "don't") with
 * a severity split on the negative path. Keeping the actions side-by-side
 * surfaces all options at once and prevents the admin from guessing whether
 * "Reject" and "Suspend" are different surfaces.
 */
export function AdminReviewSheet({
  salon,
  verification,
  open,
  onOpenChange,
}: AdminReviewSheetProps) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documents = readDocuments(verification.documents);

  function reset() {
    setDecision(null);
    setReason("");
    setError(null);
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  async function submit() {
    if (!decision) return;
    // Reject / suspend require a reason — same rule as the server schema.
    if (decision !== "VERIFIED" && reason.trim().length === 0) {
      setError("A reason is required when rejecting or suspending.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await reviewVerificationApi(salon.slug, {
        status: decision,
        reason: decision === "VERIFIED" ? undefined : reason.trim(),
      });
      toast.success(
        decision === "VERIFIED"
          ? `${salon.name} is now verified and live.`
          : decision === "SUSPENDED"
            ? `${salon.name} has been suspended.`
            : `Submission from ${salon.name} rejected.`,
      );
      close();
      router.refresh();
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : "Could not apply the decision. Please try again.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review {salon.name}</DialogTitle>
          <DialogDescription>
            {salon.city ? `${salon.city} · ` : ""}Approve to publish the salon,
            or reject with a reason the owner can act on.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section className="space-y-2">
            <Label>Submitted documents</Label>
            {documents.length === 0 ? (
              <p className="rounded-lg border bg-muted/40 px-3 py-6 text-center text-sm text-muted-foreground">
                No documents attached to this submission.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {documents.map((doc, index) => (
                  <li
                    key={`${doc.url}-${index}`}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <DocumentThumb
                      url={doc.url}
                      alt={doc.kind || `Document ${index + 1}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {doc.kind || "Untitled document"}
                      </p>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-xs text-primary underline"
                      >
                        Open file
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <Label>Decision</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <DecisionButton
                active={decision === "VERIFIED"}
                tone="success"
                icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                label="Approve"
                description="Publish the salon"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setDecision("VERIFIED");
                }}
              />
              <DecisionButton
                active={decision === "REJECTED"}
                tone="warning"
                icon={<XCircle className="h-4 w-4" aria-hidden="true" />}
                label="Reject"
                description="Ask for fixes"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setDecision("REJECTED");
                }}
              />
              <DecisionButton
                active={decision === "SUSPENDED"}
                tone="destructive"
                icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
                label="Suspend"
                description="Block the salon"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setDecision("SUSPENDED");
                }}
              />
            </div>
          </section>

          {decision && decision !== "VERIFIED" ? (
            <section className="space-y-1.5">
              <Label htmlFor="review-reason">
                Reason{" "}
                <span className="text-xs text-muted-foreground">
                  (required — sent to the owner)
                </span>
              </Label>
              <Textarea
                id="review-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  decision === "SUSPENDED"
                    ? "e.g. Documents do not match the registered business name."
                    : "e.g. Shop license photo is unreadable. Please re-upload a clearer copy."
                }
                maxLength={500}
                disabled={busy}
                aria-invalid={Boolean(error)}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/500 characters
              </p>
            </section>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={decision === "SUSPENDED" ? "destructive" : "default"}
            onClick={submit}
            disabled={busy || !decision}
          >
            {busy
              ? "Applying…"
              : decision === "VERIFIED"
                ? "Approve"
                : decision === "SUSPENDED"
                  ? "Suspend salon"
                  : decision === "REJECTED"
                    ? "Reject submission"
                    : "Apply decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DecisionButtonProps {
  active: boolean;
  tone: "success" | "warning" | "destructive";
  icon: React.ReactNode;
  label: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
}

function DecisionButton({
  active,
  tone,
  icon,
  label,
  description,
  disabled,
  onClick,
}: DecisionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-2 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? tone === "success"
            ? "border-success bg-success/10"
            : tone === "warning"
              ? "border-warning bg-warning/10"
              : "border-destructive bg-destructive/10"
          : "border-border hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "mt-0.5 shrink-0",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "destructive" && "text-destructive",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

/** Square thumbnail for an uploaded document URL. */
function DocumentThumb({ url, alt }: { url: string; alt: string }) {
  const isImage = /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);
  if (isImage) {
    return (
      <div className="relative h-32 w-full overflow-hidden rounded-md border">
        <Image
          src={url}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, 320px"
          className="object-cover"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className="flex h-32 w-full items-center justify-center rounded-md border bg-muted text-muted-foreground">
      <span className="text-xs">Non-image file</span>
    </div>
  );
}

/**
 * The documents field is stored as JSON and typed `unknown` at the API
 * boundary. We narrow defensively so a malformed row never crashes the queue.
 */
function readDocuments(
  raw: unknown,
): Array<{ kind: string; url: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as { kind?: unknown; url?: unknown };
      if (typeof record.kind !== "string" || typeof record.url !== "string") {
        return null;
      }
      return { kind: record.kind, url: record.url };
    })
    .filter((entry): entry is { kind: string; url: string } => entry !== null);
}
