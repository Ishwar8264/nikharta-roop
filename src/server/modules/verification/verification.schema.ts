import { z } from "zod";

/**
 * Verification documents are a small typed list — each entry references an
 * already-uploaded media URL plus a kind label for the reviewer.
 */
const verificationDocumentSchema = z.strictObject({
  kind: z
    .string({ error: "Document kind must be a string" })
    .trim()
    .min(1, "Document kind is required")
    .max(50, "Document kind must contain at most 50 characters"),
  url: z
    .string({ error: "Document URL must be a string" })
    .trim()
    .url("Document URL is invalid")
    .max(2048, "Document URL is too long"),
});

/** Submission body — OWNER sends this to request review. */
export const submitVerificationSchema = z.strictObject({
  documents: z
    .array(verificationDocumentSchema, { error: "Documents must be an array" })
    .min(1, "At least one document is required")
    .max(20, "At most 20 documents are allowed"),
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
    reason: z
      .string({ error: "Reason must be a string" })
      .trim()
      .max(500, "Reason must contain at most 500 characters")
      .optional(),
  })
  .refine(
    (input) =>
      input.status === "VERIFIED" ||
      (input.reason !== undefined && input.reason.length > 0),
    { message: "Reason is required when rejecting or suspending" },
  );
