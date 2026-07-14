-- Normalize existing email values before enforcing case-consistent uniqueness.
UPDATE "User"
SET "email" = NULLIF(LOWER(BTRIM("email")), '')
WHERE "email" IS NOT NULL;

-- Stop safely when normalized duplicate emails must be resolved manually.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "User"
    WHERE "email" IS NOT NULL
    GROUP BY "email"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add unique email constraint: duplicate normalized emails exist';
  END IF;
END $$;

-- Create the supported OTP delivery-channel enum.
CREATE TYPE "AuthOtpChannel" AS ENUM ('MOBILE', 'EMAIL');

-- Add generic OTP identity columns without dropping existing mobile data first.
ALTER TABLE "AuthOtp"
ADD COLUMN "channel" "AuthOtpChannel" NOT NULL DEFAULT 'MOBILE',
ADD COLUMN "identifier" VARCHAR(150);

-- Copy every existing mobile OTP identity into the new generic identifier field.
UPDATE "AuthOtp"
SET "identifier" = "mobile";

-- Make the migrated identifier mandatory after every existing row is populated.
ALTER TABLE "AuthOtp"
ALTER COLUMN "identifier" SET NOT NULL;

-- Remove the old mobile-only index before its column is removed.
DROP INDEX "AuthOtp_mobile_createdAt_idx";

-- Remove the superseded mobile-only OTP column after the data migration completes.
ALTER TABLE "AuthOtp"
DROP COLUMN "mobile";

-- Enforce database-level uniqueness for every non-null normalized user email.
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Support latest-OTP and cooldown lookups by identity, channel, and purpose.
CREATE INDEX "AuthOtp_identifier_channel_purpose_createdAt_idx"
ON "AuthOtp"("identifier", "channel", "purpose", "createdAt");

-- Support database-backed OTP request throttling by source IP and time.
CREATE INDEX "AuthOtp_ipAddress_createdAt_idx"
ON "AuthOtp"("ipAddress", "createdAt");
