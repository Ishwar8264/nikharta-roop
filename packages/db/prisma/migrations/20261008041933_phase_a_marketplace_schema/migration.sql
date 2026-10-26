-- Phase A marketplace schema:
--   salon verification, catalog templates + activation, packages,
--   salon-owned coupons, payment transactions + payouts, salon settings,
--   customer notes. Additive only — existing tables untouched.

-- CreateEnum
CREATE TYPE "SalonVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PaymentTxnType" AS ENUM ('ADVANCE', 'FINAL', 'REFUND');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN "salonId" TEXT;

-- CreateTable
CREATE TABLE "CatalogTemplate" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CatalogTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerNote" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "customerId" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "salonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageService" (
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "PackageService_pkey" PRIMARY KEY ("packageId","serviceId")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "appointmentId" TEXT NOT NULL,
    "type" "PaymentTxnType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "gatewayRef" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "salonId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonSettings" (
    "salonId" TEXT NOT NULL,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 10,
    "advanceBookingDays" INTEGER NOT NULL DEFAULT 30,
    "cancellationWindowHours" INTEGER NOT NULL DEFAULT 4,
    "noShowFee" DECIMAL(12,2),
    "acceptsAdvancePayments" BOOLEAN NOT NULL DEFAULT true,
    "walkInsAllowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SalonSettings_pkey" PRIMARY KEY ("salonId")
);

-- CreateTable
CREATE TABLE "SalonTemplate" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "salonId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SalonTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalonVerification" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "salonId" TEXT NOT NULL,
    "status" "SalonVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "documents" JSONB,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalonVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalonVerification_salonId_key" ON "SalonVerification"("salonId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogTemplate_key_key" ON "CatalogTemplate"("key");

-- CreateIndex
CREATE INDEX "SalonVerification_status_idx" ON "SalonVerification"("status");

-- CreateIndex
CREATE INDEX "CatalogTemplate_kind_isActive_idx" ON "CatalogTemplate"("kind", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SalonTemplate_salonId_templateId_key" ON "SalonTemplate"("salonId", "templateId");

-- CreateIndex
CREATE INDEX "SalonTemplate_templateId_idx" ON "SalonTemplate"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_salonId_slug_key" ON "Package"("salonId", "slug");

-- CreateIndex
CREATE INDEX "Package_salonId_isActive_deletedAt_idx" ON "Package"("salonId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "PackageService_serviceId_idx" ON "PackageService"("serviceId");

-- CreateIndex
CREATE INDEX "CustomerNote_customerId_salonId_idx" ON "CustomerNote"("customerId", "salonId");

-- CreateIndex
CREATE INDEX "CustomerNote_salonId_createdAt_idx" ON "CustomerNote"("salonId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_idempotencyKey_key" ON "PaymentTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentTransaction_appointmentId_createdAt_idx" ON "PaymentTransaction"("appointmentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Payout_salonId_status_idx" ON "Payout"("salonId", "status");

-- CreateIndex
CREATE INDEX "Coupon_salonId_isActive_idx" ON "Coupon"("salonId", "isActive");

-- AddForeignKey
ALTER TABLE "CatalogTemplate" ADD CONSTRAINT "CatalogTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageService" ADD CONSTRAINT "PackageService_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageService" ADD CONSTRAINT "PackageService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonSettings" ADD CONSTRAINT "SalonSettings_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonTemplate" ADD CONSTRAINT "SalonTemplate_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonTemplate" ADD CONSTRAINT "SalonTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CatalogTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonVerification" ADD CONSTRAINT "SalonVerification_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalonVerification" ADD CONSTRAINT "SalonVerification_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
