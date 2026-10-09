"use client";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { FormError } from "@/features/auth/shared/components/form-error";
import { ApiError } from "@/lib/api/backend.client";
import { siteConfig } from "@/config/site";
import { MediaPickerDialog } from "@/features/media";
import type { UploadedImage } from "@/features/media/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { submitVerificationApi } from "./api";
import type { SalonVerification, VerificationStatus } from "./api";

/** Common Indian salon KYC document kinds the picker offers. */
const DOCUMENT_KINDS = [
  "Shop license",
  "PAN",
  "GST certificate",
  "Salon photo 1",
  "Salon photo 2",
] as const;

interface VerificationPanelProps {
  salonSlug: string;
  initial: SalonVerification;
  /** True only when the viewer is the salon's OWNER — only owners may submit. */
  canSubmit: boolean;
}

interface DraftDocument {
  /** Local id so React keys stay stable during edit/delete. */
  tempId: string;
  kind: string;
  url: string;
}

/**
 * Status banner + 2-step submit form for the salon verification flow.
 *
 * Why local state instead of react-hook-form:
 * The submit shape is one array of `{ kind, url }` pairs with media picker
 * side effects. Plain `useState` keeps the draft model transparent — every
 * action (add, remove, replace URL) is a one-line `setDocuments` update. The
 * server schema is the source of truth for validation; we mirror its rules
 * here so the user gets immediate inline feedback before the round trip.
 */
export function VerificationPanel({
  salonSlug,
  initial,
  canSubmit,
}: VerificationPanelProps) {
  const router = useRouter();
  const isOnboarding = initial.submittedAt === null;
  const [showForm, setShowForm] = useState(isOnboarding);
  const [step, setStep] = useState<1 | 2>(1);
  const [documents, setDocuments] = useState<DraftDocument[]>(() =>
    seedDrafts(initial),
  );
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const status = initial.status;

  function toggleForm() {
    setFormError(null);
    setFieldErrors({});
    setShowForm((open) => !open);
  }

  function addDocument(image: UploadedImage) {
    setFieldErrors({});
    setDocuments((prev) => [
      ...prev,
      {
        tempId:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `doc-${prev.length}-${Date.now()}`,
        kind: "",
        url: image.url,
      },
    ]);
  }

  function replaceDocument(tempId: string, image: UploadedImage) {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.tempId === tempId ? { ...doc, url: image.url } : doc,
      ),
    );
  }

  function removeDocument(tempId: string) {
    setDocuments((prev) => prev.filter((doc) => doc.tempId !== tempId));
  }

  function setKind(tempId: string, kind: string) {
    setFieldErrors({});
    setDocuments((prev) =>
      prev.map((doc) => (doc.tempId === tempId ? { ...doc, kind } : doc)),
    );
  }

  function validate(): string | null {
    if (documents.length === 0) return "Add at least one document to submit.";
    for (const doc of documents) {
      const trimmedKind = doc.kind.trim();
      if (!trimmedKind) return "Every document needs a kind label.";
      if (trimmedKind.length > 50)
        return "Document kinds must be 50 characters or fewer.";
      if (!doc.url) return "Every document needs an uploaded file.";
      try {
        // Mirrors the zod url() rule on the server schema.
        new URL(doc.url);
      } catch {
        return "One of the document URLs is invalid.";
      }
    }
    if (documents.length > 20) return "At most 20 documents are allowed.";
    return null;
  }

  async function submit() {
    setFormError(null);
    setFieldErrors({});
    const localError = validate();
    if (localError) {
      setFormError(localError);
      return;
    }

    setBusy(true);
    try {
      await submitVerificationApi(salonSlug, {
        documents: documents.map((doc) => ({
          kind: doc.kind.trim(),
          url: doc.url,
        })),
      });
      toast.success("Documents submitted. We'll review within 1–2 days.");
      setShowForm(false);
      setStep(1);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not submit documents. Please try again.";
      setFormError(message);
      // Surface field-level errors from the API payload if present.
      if (error instanceof ApiError && error.data) {
        const payload = error.data as {
          errors?: Array<{ field: string; message: string }>;
        };
        const next: Record<string, string> = {};
        for (const issue of payload.errors ?? []) {
          if (issue.field.startsWith("documents")) {
            next[issue.field] = issue.message;
          }
        }
        if (Object.keys(next).length > 0) setFieldErrors(next);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <StatusBanner
        status={status}
        reason={initial.reason}
        onResubmit={canSubmit && status === "REJECTED" ? toggleForm : undefined}
      />

      {showForm && canSubmit ? (
        <Card>
          <CardContent className="space-y-5">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-semibold">
                {isOnboarding
                  ? "Submit your verification documents"
                  : "Resubmit your verification documents"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload your shop license, ID, and salon photos. We review most
                submissions within 1–2 business days.
              </p>
            </div>

            <StepIndicator step={step} />

            {formError ? <FormError>{formError}</FormError> : null}

            {step === 1 ? (
              <StepDocuments
                documents={documents}
                fieldErrors={fieldErrors}
                onAdd={addDocument}
                onReplace={replaceDocument}
                onRemove={removeDocument}
                onKindChange={setKind}
                disabled={busy}
              />
            ) : (
              <StepReview
                documents={documents}
                onEdit={() => setStep(1)}
                disabled={busy}
              />
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap justify-end gap-3 px-5 py-4 sm:px-8">
            {step === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={toggleForm}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const localError = validate();
                    if (localError) {
                      setFormError(localError);
                      return;
                    }
                    setFormError(null);
                    setStep(2);
                  }}
                  disabled={busy || documents.length === 0}
                >
                  Review documents
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={busy}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                >
                  {busy ? "Submitting…" : "Submit for review"}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      ) : null}

      {!canSubmit ? (
        <p className="text-sm text-muted-foreground">
          Only the salon owner can submit verification documents.
        </p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status banner                                                             */
/* -------------------------------------------------------------------------- */

interface StatusBannerProps {
  status: VerificationStatus;
  reason: string | null;
  onResubmit?: () => void;
}

/**
 * Coloured banner keyed off the verification status. Each variant carries one
 * next-action so the owner always knows what to do next.
 */
function StatusBanner({ status, reason, onResubmit }: StatusBannerProps) {
  if (status === "VERIFIED") {
    return (
      <Banner
        tone="success"
        icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
        title="Your salon is verified"
        body="Customers see the verified badge on your public profile."
      />
    );
  }

  if (status === "PENDING") {
    return (
      <Banner
        tone="warning"
        icon={<Clock className="h-5 w-5" aria-hidden="true" />}
        title="We're reviewing your documents"
        body="Usually takes 1–2 days. You'll get a notification once a decision is made."
      />
    );
  }

  if (status === "REJECTED") {
    return (
      <Banner
        tone="destructive"
        icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />}
        title="Verification rejected"
        body={
          reason ? (
            <span>
              Reason: <span className="font-medium">{reason}</span>
            </span>
          ) : (
            "Please review your documents and resubmit."
          )
        }
        action={
          onResubmit ? (
            <Button type="button" variant="destructive" onClick={onResubmit}>
              Fix and resubmit
            </Button>
          ) : null
        }
      />
    );
  }

  // SUSPENDED — only the platform can lift this, so point owners at support.
  return (
    <Banner
      tone="destructive"
      icon={<Ban className="h-5 w-5" aria-hidden="true" />}
      title="Listing suspended"
      body={
        reason ? (
          <span>
            Reason: <span className="font-medium">{reason}</span>
          </span>
        ) : (
          "Please contact support to restore your listing."
        )
      }
      action={
        <Button
          type="button"
          variant="destructive"
          render={
            <a
              href={`mailto:${siteConfig.contact.email}?subject=Suspended%20salon%20listing`}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Contact support
            </a>
          }
        />
      }
    />
  );
}

interface BannerProps {
  tone: "success" | "warning" | "destructive";
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}

function Banner({ tone, icon, title, body, action }: BannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between",
        tone === "success" &&
          "border-success/30 border-l-success bg-success/10 text-success-foreground",
        tone === "warning" &&
          "border-warning/30 border-l-warning bg-warning/10 text-warning-foreground",
        tone === "destructive" &&
          "border-destructive/30 border-l-destructive bg-destructive/10 text-destructive",
      )}
    >
      <div className="flex items-start gap-3">
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
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step indicator                                                            */
/* -------------------------------------------------------------------------- */

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2 text-xs text-muted-foreground">
      <StepDot label="1. Documents" active={step === 1} />
      <span aria-hidden="true" className="h-px w-6 bg-border" />
      <StepDot label="2. Review & submit" active={step === 2} />
    </ol>
  );
}

function StepDot({ label, active }: { label: string; active: boolean }) {
  return (
    <li
      className={cn(
        "rounded-full px-2.5 py-1 font-medium",
        active ? "bg-primary text-primary-foreground" : "bg-muted",
      )}
    >
      {label}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — documents                                                        */
/* -------------------------------------------------------------------------- */

interface StepDocumentsProps {
  documents: DraftDocument[];
  fieldErrors: Record<string, string>;
  disabled: boolean;
  onAdd: (image: UploadedImage) => void;
  onReplace: (tempId: string, image: UploadedImage) => void;
  onRemove: (tempId: string) => void;
  onKindChange: (tempId: string, kind: string) => void;
}

function StepDocuments({
  documents,
  fieldErrors,
  disabled,
  onAdd,
  onReplace,
  onRemove,
  onKindChange,
}: StepDocumentsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>Documents</Label>
          <p className="text-xs text-muted-foreground">
            {documents.length} of 20 added. At least one required.
          </p>
        </div>
        <MediaPickerDialog
          title="Add verification documents"
          description="Upload your shop license, ID, and salon photos."
          value={[]}
          onChange={(next) => {
            for (const image of next) onAdd(image);
          }}
          mode="multiple"
          max={20}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || documents.length >= 20}
              className="gap-1"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add document
            </Button>
          }
        />
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center">
          <FileText
            className="mx-auto h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Add at least one document to continue.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc, index) => (
            <li
              key={doc.tempId}
              className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center"
            >
              <DocumentThumb
                url={doc.url}
                alt={`Document ${index + 1}`}
                onRemove={disabled ? undefined : () => onRemove(doc.tempId)}
                removeLabel={`Remove document ${index + 1}`}
              />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`kind-${doc.tempId}`}>Document kind</Label>
                <Select
                  value={doc.kind}
                  onValueChange={(value) =>
                    onKindChange(doc.tempId, value ?? "")
                  }
                >
                  <SelectTrigger
                    id={`kind-${doc.tempId}`}
                    className="w-full"
                    disabled={disabled}
                  >
                    <SelectValue placeholder="Select a kind" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_KINDS.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {kind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors[`documents.${index}.kind`] ? (
                  <p className="text-xs text-destructive">
                    {fieldErrors[`documents.${index}.kind`]}
                  </p>
                ) : null}
                {fieldErrors[`documents.${index}.url`] ? (
                  <p className="text-xs text-destructive">
                    {fieldErrors[`documents.${index}.url`]}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <MediaPickerDialog
                  title="Replace document"
                  description="Pick a new file to replace this document."
                  value={[{ url: doc.url, publicId: doc.url }]}
                  onChange={(next) => {
                    const first = next[0];
                    if (first) onReplace(doc.tempId, first);
                  }}
                  mode="single"
                  max={1}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                    >
                      Replace
                    </Button>
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove document"
                  disabled={disabled}
                  onClick={() => onRemove(doc.tempId)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Square thumbnail for an uploaded document URL. Optional overlay remove
 *  button sits at the top-right corner so the thumbnail itself is the
 *  affordance — the dedicated "Replace"/trash row below remains for explicit
 *  flows. */
function DocumentThumb({
  url,
  alt,
  onRemove,
  removeLabel = "Remove document",
}: {
  url: string;
  alt: string;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const isImage = /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);
  return (
    <div className="relative h-16 w-16 shrink-0">
      <div className="relative h-full w-full overflow-hidden rounded-lg border bg-muted">
        {isImage ? (
          <Image
            src={url}
            alt={alt}
            fill
            sizes="64px"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-destructive shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — review                                                           */
/* -------------------------------------------------------------------------- */

interface StepReviewProps {
  documents: DraftDocument[];
  onEdit: () => void;
  disabled: boolean;
}

function StepReview({ documents, onEdit, disabled }: StepReviewProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Review your documents</Label>
        <p className="text-xs text-muted-foreground">
          Make sure everything is legible. You can edit before submitting.
        </p>
      </div>
      <ul className="divide-y rounded-xl border">
        {documents.map((doc, index) => (
          <li key={doc.tempId} className="flex items-center gap-3 p-3">
            <DocumentThumb url={doc.url} alt={`Document ${index + 1}`} />
            <div className="min-w-0 flex-1">
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onEdit}
        disabled={disabled}
        className="gap-1"
      >
        <X className="h-4 w-4" aria-hidden="true" />
        Edit documents
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Seeds the draft list from the server's last submission. The documents field
 * is stored as JSON and untyped at the API boundary, so we cast defensively.
 */
function seedDrafts(initial: SalonVerification): DraftDocument[] {
  if (!initial.documents) return [];
  if (!Array.isArray(initial.documents)) return [];
  return (initial.documents as Array<{ kind?: unknown; url?: unknown }>)
    .filter(
      (entry): entry is { kind: string; url: string } =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof entry.kind === "string" &&
        typeof entry.url === "string",
    )
    .map((entry, index) => ({
      tempId: `seed-${index}-${entry.url}`,
      kind: entry.kind,
      url: entry.url,
    }));
}
