-- Allow email-only accounts while preserving unique mobile numbers when present.
ALTER TABLE "User"
ALTER COLUMN "mobile" DROP NOT NULL;

-- Require every user to retain at least one supported authentication identity.
ALTER TABLE "User"
ADD CONSTRAINT "User_auth_identity_check"
CHECK ("mobile" IS NOT NULL OR "email" IS NOT NULL);
