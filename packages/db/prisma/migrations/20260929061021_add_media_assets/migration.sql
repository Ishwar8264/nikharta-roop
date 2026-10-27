-- CreateEnum
CREATE TYPE "MediaPurpose" AS ENUM ('GENERAL', 'SALON', 'PRODUCT', 'SERVICE', 'BLOG', 'AVATAR', 'REVIEW');

-- AlterTable
ALTER TABLE "AiChat" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "AiMessage" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "AiUsageLog" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "BlogCategory" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "BlogComment" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "BlogPost" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "BlogTag" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "Coupon" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "Favorite" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "LoyaltyTransaction" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "Otp" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "ProductCategory" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "ProductReview" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "Salon" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "SalonMember" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "SalonWorkingHours" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "ServiceCategory" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "ServiceReview" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "SocialAccount" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "StaffLeave" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "StaffRating" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "StaffSchedule" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "StaffServiceSkill" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- AlterTable
ALTER TABLE "UserAiUsage" ALTER COLUMN "id" SET DEFAULT (encode(gen_random_bytes(24), 'hex'::text));

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "folder" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "bytes" INTEGER,
    "purpose" "MediaPurpose" NOT NULL DEFAULT 'GENERAL',
    "attachedToType" TEXT,
    "attachedToId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_publicId_key" ON "MediaAsset"("publicId");

-- CreateIndex
CREATE INDEX "MediaAsset_userId_createdAt_idx" ON "MediaAsset"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MediaAsset_userId_purpose_deletedAt_idx" ON "MediaAsset"("userId", "purpose", "deletedAt");

-- CreateIndex
CREATE INDEX "MediaAsset_attachedToType_attachedToId_idx" ON "MediaAsset"("attachedToType", "attachedToId");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
