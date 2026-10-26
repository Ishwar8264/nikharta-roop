BEGIN;

CREATE TYPE "AccountType" AS ENUM ('CUSTOMER', 'SALON_PARTNER');

ALTER TABLE "User"
ADD COLUMN "accountType" "AccountType",
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN "partnerCompletedAt" TIMESTAMP(3),
ADD COLUMN "partnerTermsVersion" TEXT,
ADD COLUMN "partnerTermsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "partnerEligibilityBackfilledAt" TIMESTAMP(3);

-- Preserve customer access; existing profile completion is not partner consent.
UPDATE "User" SET "accountType" = 'CUSTOMER', "onboardingCompletedAt" = "updatedAt"
WHERE "isOnboarded" = true AND "deletedAt" IS NULL;

UPDATE "User" u SET "accountType" = 'SALON_PARTNER',
"partnerEligibilityBackfilledAt" = CURRENT_TIMESTAMP,
"onboardingCompletedAt" = COALESCE(u."onboardingCompletedAt", CURRENT_TIMESTAMP)
WHERE u."deletedAt" IS NULL AND EXISTS (
  SELECT 1 FROM "SalonMember" m
  JOIN "Salon" s ON s.id = m."salonId"
  WHERE m."userId" = u.id AND m.role = 'OWNER' AND s."deletedAt" IS NULL
);

COMMIT;
