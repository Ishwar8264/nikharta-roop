CREATE TYPE "SalonStatus" AS ENUM ('DRAFT', 'LIVE', 'TEMPORARILY_CLOSED', 'ARCHIVED');
ALTER TABLE "Salon" ADD COLUMN "status" "SalonStatus" NOT NULL DEFAULT 'DRAFT';
UPDATE "Salon" SET "status" = 'LIVE' WHERE "isActive" = true AND "deletedAt" IS NULL;
UPDATE "Salon" SET "status" = 'ARCHIVED' WHERE "deletedAt" IS NOT NULL;
