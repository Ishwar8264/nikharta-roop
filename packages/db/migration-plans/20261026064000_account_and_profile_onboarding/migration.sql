-- Candidate only: deploy with matching account/profile authorization changes.
ALTER TYPE "OtpPurpose" ADD VALUE 'REGISTRATION_VERIFICATION';
ALTER TYPE "OtpPurpose" ADD VALUE 'LOGIN';
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "ProfileStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION';
-- Preserve existing verified account access; deletion remains independently authoritative.
UPDATE "User" SET "status" = 'ACTIVE'
WHERE "deletedAt" IS NULL AND ("emailVerified" OR "phoneVerified");
ALTER TABLE "User" ADD CONSTRAINT "User_active_verified_check"
CHECK ("status" <> 'ACTIVE' OR "emailVerified" OR "phoneVerified");

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

-- Historical consumption times are unknown; keep them null rather than fabricate them.
ALTER TABLE "Otp" ADD COLUMN "usedAt" TIMESTAMP(3);
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_consumption_check"
CHECK ("usedAt" IS NULL OR "isUsed");
