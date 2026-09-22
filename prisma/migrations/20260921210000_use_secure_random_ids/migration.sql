-- IDs are generated in PostgreSQL so every writer, including nested Prisma
-- operations and direct SQL, gets the same 48-character contract.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "Otp" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "RefreshToken" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "SocialAccount" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "Salon" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "SalonWorkingHours" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "SalonMember" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "StaffSchedule" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "StaffLeave" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "ServiceCategory" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "Service" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "ProductCategory" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "Product" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "StaffServiceSkill" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "Favorite" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "ServiceReview" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "ProductReview" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "StaffRating" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "Coupon" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "Appointment" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "Payment" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "LoyaltyTransaction" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "Notification" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "AuditLog" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "UserAiUsage" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "AiUsageLog" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "AiChat" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "AiMessage" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "BlogPost" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "BlogComment" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "BlogCategory" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
ALTER TABLE "BlogTag" ALTER COLUMN "id" SET DEFAULT encode(gen_random_bytes(24), 'hex');
