-- DESIGN ONLY: run the contract step only with Profile-aware application code.
-- Refuse to discard legacy fields if they changed after the backfill.
BEGIN;
LOCK TABLE "User", "Salon", "Profile", "UserOnboarding", "LoyaltyWallet" IN ACCESS EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "User" u LEFT JOIN "Profile" p ON p."personalUserId" = u."id"
    WHERE p."id" IS NULL OR
      (u."name", u."avatar", u."coverImage", u."bio", u."lat", u."lng") IS DISTINCT FROM
      (p."name", p."avatar", p."coverImage", p."bio", p."lat", p."lng")
  ) THEN RAISE EXCEPTION 'Personal profile backfill is missing or stale'; END IF;
  IF EXISTS (
    SELECT 1 FROM "Salon" s LEFT JOIN "Profile" p ON p."salonId" = s."id"
    WHERE p."id" IS NULL OR
      (s."name", s."coverImage", s."bannerImage", s."shortDescription") IS DISTINCT FROM
      (p."name", p."avatar", p."coverImage", p."bio")
  ) THEN RAISE EXCEPTION 'Salon profile backfill is missing or stale'; END IF;
  IF EXISTS (
    SELECT 1 FROM "User" u LEFT JOIN "UserOnboarding" o ON o."userId" = u."id"
      LEFT JOIN "LoyaltyWallet" w ON w."userId" = u."id"
    WHERE o."userId" IS NULL OR w."userId" IS NULL OR u."loyaltyPoints" <> w."points" OR
      (u."accountType", u."isOnboarded", u."onboardingCompletedAt", u."partnerCompletedAt",
       u."partnerTermsVersion", u."partnerTermsAcceptedAt", u."partnerEligibilityBackfilledAt") IS DISTINCT FROM
      (o."accountType", o."isOnboarded", o."onboardingCompletedAt", o."partnerCompletedAt",
       o."partnerTermsVersion", o."partnerTermsAcceptedAt", o."partnerEligibilityBackfilledAt")
  ) THEN RAISE EXCEPTION 'Onboarding or wallet backfill is missing or stale'; END IF;
END;
$$;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "accountType",
DROP COLUMN "avatar",
DROP COLUMN "bio",
DROP COLUMN "coverImage",
DROP COLUMN "isOnboarded",
DROP COLUMN "lat",
DROP COLUMN "lng",
DROP COLUMN "loyaltyPoints",
DROP COLUMN "name",
DROP COLUMN "onboardingCompletedAt",
DROP COLUMN "partnerCompletedAt",
DROP COLUMN "partnerEligibilityBackfilledAt",
DROP COLUMN "partnerTermsAcceptedAt",
DROP COLUMN "partnerTermsVersion";

-- AlterTable
ALTER TABLE "Salon" DROP COLUMN "bannerImage",
DROP COLUMN "coverImage",
DROP COLUMN "name",
DROP COLUMN "shortDescription";

COMMIT;
