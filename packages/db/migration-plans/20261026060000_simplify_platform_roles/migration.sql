-- Apply with the matching application release. Existing user IDs, credentials,
-- refresh tokens, and business records are preserved. Old access JWTs can refresh
-- against the database to obtain the current ADMIN role.
BEGIN;

UPDATE "User" SET "role" = 'ADMIN' WHERE "role"::text = 'SUPER_ADMIN';

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "PlatformRole" RENAME TO "PlatformRole_legacy";
CREATE TYPE "PlatformRole" AS ENUM ('ADMIN', 'CONTENT_ADMIN', 'USER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "PlatformRole"
  USING "role"::text::"PlatformRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
DROP TYPE "PlatformRole_legacy";

COMMIT;
