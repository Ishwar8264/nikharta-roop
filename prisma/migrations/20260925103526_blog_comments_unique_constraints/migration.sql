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
