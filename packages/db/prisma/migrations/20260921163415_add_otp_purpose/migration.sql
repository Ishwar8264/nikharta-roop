-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "purpose" "OtpPurpose" NOT NULL DEFAULT 'EMAIL_VERIFICATION';

-- AlterTable
ALTER TABLE "_BlogPostToBlogTag" ADD CONSTRAINT "_BlogPostToBlogTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BlogPostToBlogTag_AB_unique";

-- CreateIndex
CREATE INDEX "Otp_userId_purpose_isUsed_idx" ON "Otp"("userId", "purpose", "isUsed");
