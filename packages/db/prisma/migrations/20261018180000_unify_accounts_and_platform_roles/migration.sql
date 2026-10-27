-- Deploy with auth writes paused: credentials move atomically, sessions retain user IDs.
BEGIN;
ALTER TYPE "PlatformRole" ADD VALUE 'ADMIN';
ALTER TYPE "PlatformRole" ADD VALUE 'CONTENT_ADMIN';

-- Keep every existing OAuth identity and identifier. Abort rather than discard duplicates.
ALTER TABLE "SocialAccount" RENAME TO "Account";
ALTER TABLE "Account" RENAME CONSTRAINT "SocialAccount_pkey" TO "Account_pkey";
ALTER TABLE "Account" RENAME CONSTRAINT "SocialAccount_userId_fkey" TO "Account_userId_fkey";
ALTER INDEX "SocialAccount_provider_providerUserId_key" RENAME TO "Account_provider_providerUserId_key";
ALTER TABLE "Account" ADD COLUMN "passwordHash" TEXT;
CREATE UNIQUE INDEX "Account_userId_provider_key" ON "Account"("userId", "provider");

INSERT INTO "Account" ("userId", "provider", "providerUserId", "passwordHash", "createdAt")
SELECT "id", 'credentials', "id", "password", "createdAt"
FROM "User" WHERE "password" IS NOT NULL;

-- Hashes have been copied byte-for-byte; no password reset or session revocation.
ALTER TABLE "User" DROP COLUMN "password";
ALTER TABLE "Account" ADD CONSTRAINT "Account_credential_shape_check" CHECK (
  ("provider" = 'credentials' AND "providerUserId" = "userId" AND "passwordHash" IS NOT NULL)
  OR ("provider" <> 'credentials' AND "passwordHash" IS NULL)
);
COMMIT;
