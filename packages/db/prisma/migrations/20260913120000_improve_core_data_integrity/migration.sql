-- Prices and totals must use exact decimal arithmetic.
ALTER TABLE "Appointment"
  ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(12,2),
  ALTER COLUMN "discount" SET DATA TYPE DECIMAL(12,2),
  ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2),
  ALTER COLUMN "tax" SET DATA TYPE DECIMAL(12,2);

ALTER TABLE "AppointmentService"
  ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

ALTER TABLE "Coupon"
  ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(12,2),
  ALTER COLUMN "minOrderAmount" SET DATA TYPE DECIMAL(12,2),
  ALTER COLUMN "maxDiscount" SET DATA TYPE DECIMAL(12,2);

ALTER TABLE "Payment"
  ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
  ALTER COLUMN "refundAmount" SET DATA TYPE DECIMAL(12,2);

ALTER TABLE "Product"
  ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

ALTER TABLE "Service"
  ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);

-- Store the IANA timezone because weekly hours are local to each salon.
ALTER TABLE "Salon"
  ADD COLUMN "country" TEXT NOT NULL DEFAULT 'IN',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- Service and product URLs only need to be unique within their salon.
DROP INDEX "Product_slug_key";
DROP INDEX "Service_slug_key";
CREATE UNIQUE INDEX "Product_salonId_slug_key" ON "Product"("salonId", "slug");
CREATE UNIQUE INDEX "Service_salonId_slug_key" ON "Service"("salonId", "slug");

-- These relations were previously application-only string IDs.
ALTER TABLE "StaffSchedule"
  ADD CONSTRAINT "StaffSchedule_salonId_fkey"
  FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffLeave"
  ADD CONSTRAINT "StaffLeave_salonId_fkey"
  FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffServiceSkill"
  ADD CONSTRAINT "StaffServiceSkill_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AppointmentService"
  ADD CONSTRAINT "AppointmentService_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index the main availability and salon catalogue queries.
CREATE INDEX "Appointment_staffId_startTime_endTime_idx"
  ON "Appointment"("staffId", "startTime", "endTime");
CREATE INDEX "AppointmentService_staffId_idx" ON "AppointmentService"("staffId");
CREATE INDEX "Product_salonId_isActive_deletedAt_idx"
  ON "Product"("salonId", "isActive", "deletedAt");
CREATE INDEX "Service_salonId_isActive_deletedAt_idx"
  ON "Service"("salonId", "isActive", "deletedAt");
CREATE INDEX "StaffLeave_staffId_salonId_startDate_endDate_idx"
  ON "StaffLeave"("staffId", "salonId", "startDate", "endDate");

-- One customer review per item, and one staff rating per appointment.
CREATE UNIQUE INDEX "ProductReview_productId_userId_key"
  ON "ProductReview"("productId", "userId");
CREATE UNIQUE INDEX "ServiceReview_serviceId_userId_key"
  ON "ServiceReview"("serviceId", "userId");
CREATE UNIQUE INDEX "StaffRating_appointmentId_staffId_key"
  ON "StaffRating"("appointmentId", "staffId");

-- A favorite must target exactly one entity and cannot be duplicated.
ALTER TABLE "Favorite"
  ADD CONSTRAINT "Favorite_exactly_one_target_check"
  CHECK (num_nonnulls("salonId", "serviceId", "productId") = 1);

CREATE UNIQUE INDEX "Favorite_userId_salonId_key"
  ON "Favorite"("userId", "salonId") WHERE "salonId" IS NOT NULL;
CREATE UNIQUE INDEX "Favorite_userId_serviceId_key"
  ON "Favorite"("userId", "serviceId") WHERE "serviceId" IS NOT NULL;
CREATE UNIQUE INDEX "Favorite_userId_productId_key"
  ON "Favorite"("userId", "productId") WHERE "productId" IS NOT NULL;

-- Critical invariants belong in the database as a final safety net.
ALTER TABLE "Service"
  ADD CONSTRAINT "Service_price_check" CHECK ("price" >= 0),
  ADD CONSTRAINT "Service_duration_check" CHECK ("duration" > 0);

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_price_check" CHECK ("price" >= 0),
  ADD CONSTRAINT "Product_stock_check" CHECK ("stock" >= 0);

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_time_range_check" CHECK ("endTime" > "startTime"),
  ADD CONSTRAINT "Appointment_subtotal_check" CHECK ("subtotal" >= 0),
  ADD CONSTRAINT "Appointment_discount_check" CHECK ("discount" >= 0 AND "discount" <= "subtotal"),
  ADD CONSTRAINT "Appointment_tax_check" CHECK ("tax" >= 0),
  ADD CONSTRAINT "Appointment_total_price_check" CHECK ("totalPrice" >= 0);

ALTER TABLE "AppointmentService"
  ADD CONSTRAINT "AppointmentService_price_check" CHECK ("price" >= 0);

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_check" CHECK ("amount" > 0),
  ADD CONSTRAINT "Payment_refund_amount_check"
  CHECK ("refundAmount" IS NULL OR ("refundAmount" >= 0 AND "refundAmount" <= "amount"));

ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_date_range_check" CHECK ("validUntil" > "validFrom"),
  ADD CONSTRAINT "Coupon_discount_value_check"
    CHECK ("discountValue" > 0 AND ("discountType" <> 'PERCENTAGE' OR "discountValue" <= 100)),
  ADD CONSTRAINT "Coupon_min_order_amount_check" CHECK ("minOrderAmount" IS NULL OR "minOrderAmount" >= 0),
  ADD CONSTRAINT "Coupon_max_discount_check" CHECK ("maxDiscount" IS NULL OR "maxDiscount" >= 0),
  ADD CONSTRAINT "Coupon_usage_check"
    CHECK ("usedCount" >= 0 AND "perUserLimit" > 0 AND ("usageLimit" IS NULL OR ("usageLimit" >= 0 AND "usedCount" <= "usageLimit")));

ALTER TABLE "StaffLeave"
  ADD CONSTRAINT "StaffLeave_date_range_check" CHECK ("endDate" > "startDate");

ALTER TABLE "ServiceReview"
  ADD CONSTRAINT "ServiceReview_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "ProductReview"
  ADD CONSTRAINT "ProductReview_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "StaffRating"
  ADD CONSTRAINT "StaffRating_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
