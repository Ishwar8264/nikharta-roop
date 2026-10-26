-- Candidate only: deploy with matching account/profile authorization changes.
BEGIN;

ALTER TYPE "OtpPurpose" RENAME TO "OtpPurpose_legacy";
CREATE TYPE "OtpPurpose" AS ENUM (
  'REGISTRATION',
  'LOGIN',
  'PASSWORD_RESET',
  'CONTACT_VERIFICATION',
  'CONTACT_CHANGE',
  'SECURE_ACTION',
  'STAFF_ACTIVATION'
);
CREATE TYPE "OtpTarget" AS ENUM ('EMAIL', 'PHONE');
CREATE TYPE "OtpStatus" AS ENUM (
  'PENDING',
  'SENT',
  'DELIVERED',
  'VERIFIED',
  'FAILED',
  'EXPIRED',
  'CANCELLED'
);

ALTER TABLE "Otp"
  ALTER COLUMN "purpose" DROP DEFAULT,
  ADD COLUMN "target" "OtpTarget",
  ADD COLUMN "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "verifiedAt" TIMESTAMP(3);
UPDATE "Otp" SET
  "target" = CASE WHEN "channel" = 'EMAIL' THEN 'EMAIL'::"OtpTarget" ELSE 'PHONE'::"OtpTarget" END,
  "status" = CASE
    WHEN "isUsed" THEN 'VERIFIED'::"OtpStatus"
    WHEN "expiresAt" <= CURRENT_TIMESTAMP THEN 'EXPIRED'::"OtpStatus"
    ELSE 'PENDING'::"OtpStatus"
  END;
ALTER TABLE "Otp" ALTER COLUMN "target" SET NOT NULL;
ALTER TABLE "Otp" ALTER COLUMN "purpose" TYPE "OtpPurpose" USING (
  CASE "purpose"::text
    WHEN 'PASSWORD_RESET' THEN 'PASSWORD_RESET'
    WHEN 'EMAIL_VERIFICATION' THEN 'CONTACT_VERIFICATION'
    WHEN 'PHONE_VERIFICATION' THEN 'CONTACT_VERIFICATION'
  END
)::"OtpPurpose";
DROP TYPE "OtpPurpose_legacy";

ALTER TYPE "OtpChannel" RENAME TO "OtpChannel_legacy";
CREATE TYPE "OtpChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'VOICE');
ALTER TABLE "Otp" ALTER COLUMN "channel" TYPE "OtpChannel" USING (
  CASE "channel"::text
    WHEN 'PHONE' THEN 'SMS'
    ELSE "channel"::text
  END
)::"OtpChannel";
DROP TYPE "OtpChannel_legacy";

ALTER TABLE "Otp" DROP COLUMN "isUsed";
CREATE INDEX "Otp_userId_status_idx" ON "Otp"("userId", "status");
CREATE INDEX "Otp_userId_purpose_status_idx" ON "Otp"("userId", "purpose", "status");
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_attempts_check"
CHECK ("attempts" >= 0 AND "maxAttempts" > 0 AND "attempts" <= "maxAttempts");
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_verified_time_check"
CHECK ("verifiedAt" IS NULL OR "status" = 'VERIFIED');
CREATE TYPE "UserStatus" AS ENUM (
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
  'BANNED',
  'DEACTIVATED',
  'PENDING_DELETION',
  'DELETED'
);
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION';
ALTER TABLE "User" ADD CONSTRAINT "User_active_verified_check"
CHECK ("status" <> 'ACTIVE' OR "emailVerified" OR "phoneVerified");
ALTER TABLE "User" ADD CONSTRAINT "User_deleted_status_check"
CHECK (("status" = 'DELETED') = ("deletedAt" IS NOT NULL)) NOT VALID;

ALTER TABLE "Profile" ADD COLUMN "status" "ProfileStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "UserOnboarding"
  ADD COLUMN "currentStep" TEXT,
  ADD COLUMN "draft" JSONB,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "ProfileOnboarding" (
  "profileId" TEXT PRIMARY KEY REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
  "status" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
  "currentStep" TEXT,
  "draft" JSONB,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileOnboarding_completion_check" CHECK (
    ("status" = 'COMPLETED') = ("completedAt" IS NOT NULL)
  )
);
-- No historical profile completion or activation is inferred from account onboarding.
INSERT INTO "ProfileOnboarding" ("profileId") SELECT "id" FROM "Profile";

CREATE FUNCTION provision_profile_onboarding() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "ProfileOnboarding" ("profileId") VALUES (NEW."id");
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Profile_provision_onboarding" AFTER INSERT ON "Profile"
FOR EACH ROW EXECUTE FUNCTION provision_profile_onboarding();

-- Activation requires explicit completion; completion alone never activates a profile.
CREATE FUNCTION check_profile_activation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_profile_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'Profile' THEN target_profile_id := NEW."id";
  ELSE target_profile_id := OLD."profileId";
  END IF;
  PERFORM 1 FROM "Profile" WHERE "id" = target_profile_id FOR UPDATE;
  IF EXISTS (
    SELECT 1 FROM "Profile" p WHERE p."id" = target_profile_id AND p."status" = 'ACTIVE'
    AND NOT EXISTS (SELECT 1 FROM "ProfileOnboarding" o
      WHERE o."profileId" = p."id" AND o."status" = 'COMPLETED')
  ) THEN
    RAISE EXCEPTION 'Active profiles require completed profile onboarding' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER "Profile_activation_check"
AFTER INSERT OR UPDATE ON "Profile" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_profile_activation();
CREATE CONSTRAINT TRIGGER "ProfileOnboarding_activation_check"
AFTER UPDATE OR DELETE ON "ProfileOnboarding" DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION check_profile_activation();

-- Onboarding identity is stable; progress belongs to exactly this profile.
CREATE FUNCTION preserve_profile_onboarding_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."profileId" IS DISTINCT FROM OLD."profileId" THEN
    RAISE EXCEPTION 'Profile onboarding cannot be reassigned' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "ProfileOnboarding_immutable_identity" BEFORE UPDATE ON "ProfileOnboarding"
FOR EACH ROW EXECUTE FUNCTION preserve_profile_onboarding_identity();

-- Preserve existing lifecycle facts without inventing moderation history.
UPDATE "User" SET "status" = 'DELETED' WHERE "deletedAt" IS NOT NULL;
UPDATE "User" SET "status" = 'ACTIVE'
WHERE "deletedAt" IS NULL AND ("emailVerified" OR "phoneVerified");

COMMIT;
BEGIN;
ALTER TABLE "User" VALIDATE CONSTRAINT "User_deleted_status_check";
COMMIT;
