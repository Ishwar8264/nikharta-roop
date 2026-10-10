import { z } from "zod";
import {
  REQUIRED_DOCUMENT_KINDS,
  VERIFICATION_DOCUMENT_KINDS,
} from "@/features/verification/policy";

/**
 * Verification documents are a small typed list — each entry references an
 * server-registered private media ID plus a supported proof category.
 */
const verificationDocumentSchema = z.strictObject({
  kind: z.enum(VERIFICATION_DOCUMENT_KINDS),
  mediaId: z
    .string()
    .regex(/^[a-f0-9]{48}$/i, "Upload a verification document first"),
});

/** Submission body — OWNER sends this to request review. */
export const submitVerificationSchema = z
  .strictObject({
    documents: z
      .array(verificationDocumentSchema, {
        error: "Documents must be an array",
      })
      .min(1, "At least one document is required")
      .max(20, "At most 20 documents are allowed"),
  })
  .superRefine(({ documents }, context) => {
    for (const kind of REQUIRED_DOCUMENT_KINDS) {
      if (!documents.some((document) => document.kind === kind))
        context.addIssue({
          code: "custom",
          path: ["documents"],
          message: `Required document missing: ${kind}`,
        });
    }
    if (
      new Set(documents.map((document) => document.mediaId)).size !==
      documents.length
    )
      context.addIssue({
        code: "custom",
        path: ["documents"],
        message: "Each document must use a different uploaded file",
      });
  });

export const approvalEvidenceSchema = z.strictObject({
  identityVerified: z.literal(true),
  businessVerified: z.literal(true),
  authorityVerified: z.literal(true),
  addressMatched: z.literal(true),
  premisesVerified: z.literal(true),
  identitySource: z.enum([
    "Income Tax",
    "DigiLocker",
    "Authorised PAN verification provider",
  ]),
  identityReference: z.string().trim().min(6).max(160),
  businessAuthority: z.string().trim().min(3).max(160),
  businessReference: z.string().trim().min(6).max(160),
  notes: z
    .string()
    .trim()
    .min(
      40,
      "Record the source, matching details and verification outcome (at least 40 characters)",
    )
    .max(2000),
});

/**
 * Admin review body.
 *
 * Why the refine:
 * A rejection or suspension without a reason leaves the owner with no way to
 * fix the problem, so the reason is mandatory for those outcomes.
 */
export const reviewVerificationSchema = z
  .strictObject({
    status: z.enum(["VERIFIED", "REJECTED", "SUSPENDED"], {
      error: "Status must be VERIFIED, REJECTED, or SUSPENDED",
    }),
    expectedUpdatedAt: z.iso.datetime(),
    evidence: approvalEvidenceSchema.optional(),
    reason: z
      .string({ error: "Reason must be a string" })
      .trim()
      .max(500, "Reason must contain at most 500 characters")
      .optional(),
  })
  .refine((input) => input.status !== "VERIFIED" || Boolean(input.evidence), {
    path: ["evidence"],
    message:
      "Official-source evidence and all review checks are required to approve",
  })
  .refine(
    (input) =>
      input.status === "VERIFIED" ||
      (input.reason !== undefined && input.reason.length > 0),
    { message: "Reason is required when rejecting or suspending" },
  );
