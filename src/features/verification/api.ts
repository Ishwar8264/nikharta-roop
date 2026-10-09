import { api } from "@/lib/api/backend.client";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

/** Mirrors `PublicSalonVerification` (dates serialize to strings over JSON). */
export interface SalonVerification {
  status: VerificationStatus;
  documents: unknown | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reason: string | null;
}

export interface VerificationDocument {
  kind: string;
  url: string;
}

/** Loads the salon's verification status. MANAGER+. */
export function getVerificationApi(salonRef: string) {
  return api.get<{ message: string; data: { verification: SalonVerification } }>(
    `/salons/${encodeURIComponent(salonRef)}/verification`,
  );
}

/** Submits (or resubmits) verification documents. OWNER only. */
export function submitVerificationApi(
  salonRef: string,
  input: { documents: VerificationDocument[] },
) {
  return api.post<{
    message: string;
    data: { verification: SalonVerification };
  }>(`/salons/${encodeURIComponent(salonRef)}/verification/submit`, input);
}

/** Applies an admin decision. SUPER_ADMIN only. */
export function reviewVerificationApi(
  salonRef: string,
  input: { status: "VERIFIED" | "REJECTED" | "SUSPENDED"; reason?: string },
) {
  return api.post<{
    message: string;
    data: { verification: SalonVerification };
  }>(
    `/admin/salons/${encodeURIComponent(salonRef)}/verification/review`,
    input,
  );
}
