"use client";

import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  Upload,
  Trash2,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { routes } from "@/config/routes";
import { SelectField } from "@/components/shared/select-field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { ApiError } from "@/lib/api/backend.client";
import { siteConfig } from "@/config/site";
import { MediaPickerDialog } from "@/features/media";
import type { UploadedImage } from "@/features/media/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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

const DOCUMENT_GUIDANCE: Record<string, string> = {
  "Shop license": "A clear photo of your shop or business license.",
  PAN: "A clear photo of the salon owner's PAN card.",
  "GST certificate":
    "A clear photo of your salon's GST registration certificate.",
  "Salon photo 1": "Show the entrance and your salon's signboard.",
  "Salon photo 2": "Show the salon interior and workstations.",
};

interface VerificationPanelProps {
  salonSlug: string;
  salonName: string;
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
  salonName,
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
  const heading = (
    <div className="min-w-0 space-y-2">
      <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        Verify your salon
      </h1>
      <p className="break-words text-lg font-medium text-foreground sm:text-xl">
        {salonName}
      </p>
    </div>
  );

  function toggleForm() {
    setFormError(null);
    setFieldErrors({});
    setShowForm((open) => !open);
  }

  function addDocument(image: UploadedImage, kind: string) {
    setFieldErrors({});
    setDocuments((prev) => [
      ...prev,
      {
        tempId:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `doc-${prev.length}-${Date.now()}`,
        kind,
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
      if (!trimmedKind)
        return "Choose a type for each document before continuing.";
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
      {status !== "PENDING" || isOnboarding ? (
        <div className="rounded-xl border bg-card p-5 sm:p-6">{heading}</div>
      ) : null}
      <StatusBanner
        heading={heading}
        status={status}
        hasSubmitted={!isOnboarding}
        reason={initial.reason}
        onResubmit={canSubmit && status === "REJECTED" ? toggleForm : undefined}
      />

      {showForm && canSubmit ? (
        <Card
          className="gap-0 overflow-visible rounded-xl py-0"
          data-form-rounded="true"
        >
          <CardContent className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold">
                {isOnboarding
                  ? "Verification documents"
                  : "Update verification documents"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose a document type, upload a clear photo, then review and
                submit.
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
          <CardFooter className="flex flex-col-reverse items-stretch gap-3 rounded-b-xl border-t bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
            {step === 1 ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(routes.salonManage(salonSlug))}
                  className="h-10"
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
                  className="h-10"
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
                  className="h-10"
                  disabled={busy}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={submit}
                  className="h-10"
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
  heading: React.ReactNode;
  status: VerificationStatus;
  hasSubmitted: boolean;
  reason: string | null;
  onResubmit?: () => void;
}

/**
 * Coloured banner keyed off the verification status. Each variant carries one
 * next-action so the owner always knows what to do next.
 */
function StatusBanner({
  heading,
  status,
  hasSubmitted,
  reason,
  onResubmit,
}: StatusBannerProps) {
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
    if (hasSubmitted) {
      return (
        <section
          role="status"
          aria-labelledby="verification-thank-you"
          className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-sm"
        >
          <div className="space-y-5 p-5 sm:p-7">
            <div className="flex flex-col gap-4 border-b border-primary/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              {heading}
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-warning/40 bg-warning px-3 py-1 text-xs font-medium text-warning-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                Under review
              </span>
            </div>
            <div className="space-y-2">
              <h2
                id="verification-thank-you"
                className="flex items-start gap-2 font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                Thank you for choosing Nikharta Roop!
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                We&apos;ve received your documents and we&apos;re reviewing your salon.
                You&apos;re one step closer to welcoming new customers.
              </p>
            </div>
          </div>
          <div className="grid gap-4 border-t border-primary/10 bg-background/30 px-5 py-4 sm:grid-cols-2 sm:px-7">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">What happens next?</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Your salon will be visible to customers after approval.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Review time</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Usually 1–2 business days. Check this page for updates.
              </p>
            </div>
          </div>
        </section>
      );
    }
    return (
      <Banner
        tone="neutral"
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
        title="Salon created"
        body="Submit your documents for approval. Your salon will be visible to customers after approval."
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
  tone: "success" | "warning" | "destructive" | "neutral";
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}

function Banner({ tone, icon, title, body, action }: BannerProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
        tone === "neutral" && "border-border bg-muted/20",
        tone === "success" &&
          "border-success/30 bg-success/10 text-success-foreground",
        tone === "warning" &&
          "border-warning/30 bg-warning/10 text-warning-foreground",
        tone === "destructive" &&
          "border-destructive/30 bg-destructive/10 text-destructive",
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
    <ol
      aria-label="Verification progress"
      className="grid grid-cols-2 gap-3 border-b pb-5"
    >
      <StepDot
        number={1}
        label="Documents"
        active={step === 1}
        completed={step === 2}
      />
      <StepDot number={2} label="Review and submit" active={step === 2} />
    </ol>
  );
}

function StepDot({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed?: boolean;
}) {
  return (
    <li
      aria-current={active ? "step" : undefined}
      className={cn(
        "flex items-center gap-2 text-xs sm:text-sm",
        active ? "font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          active || completed
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {completed ? (
          <CheckCircle2 className="size-4" aria-label="Completed" />
        ) : (
          number
        )}
      </span>
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
  onAdd: (image: UploadedImage, kind: string) => void;
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
  const [selectedKind, setSelectedKind] = useState<string | null>(null);
  const uploadDisabled = disabled || !selectedKind || documents.length >= 20;
  const picker = (
    <MediaPickerDialog
      title={
        selectedKind
          ? `Upload ${selectedKind.toLowerCase()}`
          : "Upload document"
      }
      description={selectedKind ? DOCUMENT_GUIDANCE[selectedKind] : undefined}
      value={[]}
      onChange={(next) => {
        const image = next[0];
        if (image && selectedKind) onAdd(image, selectedKind);
      }}
      mode="single"
      max={1}
      maxSizeMB={5}
      disabled={uploadDisabled}
      triggerClassName="w-full sm:w-auto"
      trigger={
        <Button
          type="button"
          disabled={uploadDisabled}
          className="h-11 w-full gap-2 sm:w-auto"
        >
          <Upload className="size-4" aria-hidden="true" /> Upload document
        </Button>
      }
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SelectField
          id="upload-document-type"
          label="Document type"
          isRequired
          options={DOCUMENT_KINDS.map((kind) => ({ value: kind, label: kind }))}
          value={selectedKind}
          onValueChange={setSelectedKind}
          placeholder="Choose a document type"
          disabled={disabled || documents.length >= 20}
          className="min-w-0 flex-1"
        />
        {picker}
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          {selectedKind
            ? DOCUMENT_GUIDANCE[selectedKind]
            : "Select a document type to enable upload."}
        </p>
        <p>JPG, PNG, WebP or AVIF · Up to 5 MB per image</p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <h3 className="text-sm font-medium">Uploaded documents</h3>
        <span className="text-xs text-muted-foreground">
          {documents.length}/20
        </span>
      </div>
      {documents.length > 0 ? (
        <ul className="space-y-3">
          {documents.map((doc, index) => (
            <li
              key={doc.tempId}
              className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center"
            >
              <DocumentThumb url={doc.url} alt={`Document ${index + 1}`} />
              <div className="flex-1 space-y-1.5">
                <SelectField
                  id={`kind-${doc.tempId}`}
                  label="Document type"
                  isRequired
                  options={DOCUMENT_KINDS.map((kind) => ({
                    value: kind,
                    label: kind,
                  }))}
                  value={doc.kind || null}
                  onValueChange={(value) =>
                    onKindChange(doc.tempId, value ?? "")
                  }
                  placeholder="Choose a document type"
                  disabled={disabled}
                  error={fieldErrors[`documents.${index}.kind`]}
                />
                {fieldErrors[`documents.${index}.url`] ? (
                  <p className="text-xs text-destructive">
                    {fieldErrors[`documents.${index}.url`]}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <MediaPickerDialog
                  title="Replace document"
                  disabled={disabled}
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
      ) : (
        <p className="text-sm text-muted-foreground">
          No documents added yet. Add at least one to continue.
        </p>
      )}
    </div>
  );
}

/** Compact preview for the document list and submission review. */
function DocumentThumb({ url, alt }: { url: string; alt: string }) {
  const isImage = /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);
  return (
    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
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
          <FileText className="size-6" aria-hidden="true" />
        </div>
      )}
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
        <Pencil className="h-4 w-4" aria-hidden="true" />
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
