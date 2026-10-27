ALTER TYPE "MediaPurpose" ADD VALUE 'VERIFICATION';

CREATE TABLE "SalonVerificationReview" (
  "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
  "verificationId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "status" "SalonVerificationStatus" NOT NULL,
  "reason" TEXT,
  "submission" JSONB NOT NULL,
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SalonVerificationReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SalonVerificationReview_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "SalonVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "SalonVerificationReview_verificationId_createdAt_idx" ON "SalonVerificationReview"("verificationId", "createdAt");
