-- Prepared schema migration: requires matching application changes before rollout.
BEGIN;
ALTER TABLE "Profile" RENAME COLUMN "name" TO "displayName";
ALTER TABLE "Profile" ADD COLUMN "slug" VARCHAR(120) NOT NULL
  DEFAULT ('profile-'::text || encode(gen_random_bytes(8), 'hex'::text));
CREATE UNIQUE INDEX "Profile_slug_key" ON "Profile"("slug");

-- Preserve existing salon URLs before removing the duplicate slug owner.
UPDATE "Profile" p SET "slug" = s."slug" FROM "Salon" s WHERE p."salonId" = s."id";

-- The name is a suggestion, never a route key. Uniqueness is enforced by the DB.
CREATE FUNCTION allocate_profile_slug(display_name TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  base TEXT := left(trim(both '-' from regexp_replace(lower(COALESCE(display_name, '')), '[^a-z0-9]+', '-', 'g')), 90);
  candidate TEXT;
  suffix INTEGER := 1;
BEGIN
  IF length(base) < 2 OR base IN ('admin', 'api', 'auth', 'login', 'register', 'settings', 'search', 'create', 'new', 'edit', 'me', 'feed', 'chat', 'salons', 'profiles') THEN base := 'member'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('profile-slug:' || base, 0));
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM "Profile" WHERE "slug" = candidate) LOOP
    suffix := suffix + 1;
    candidate := base || '-' || suffix::text;
  END LOOP;
  RETURN candidate;
END;
$$;
DO $$ DECLARE p RECORD;
BEGIN
  FOR p IN SELECT "id", "displayName" FROM "Profile" WHERE "type" = 'PERSONAL' ORDER BY "id" LOOP
    UPDATE "Profile" SET "slug" = allocate_profile_slug(p."displayName") WHERE "id" = p."id";
  END LOOP;
END;
$$;
UPDATE "SalonMember" SET "slug" = 'staff-' || encode(gen_random_bytes(8), 'hex') WHERE "slug" IS NULL;

-- CreateEnum
CREATE TYPE "ContentFormat" AS ENUM ('TEXT', 'HTML', 'JSON');

-- DropIndex
DROP INDEX "Salon_slug_key";

-- AlterTable
ALTER TABLE "AiChat" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('ai-chat-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "AiMessage" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('ai-message-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "descriptionFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "descriptionJson" TYPE JSONB USING "descriptionJson"::jsonb;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('booking-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('payment-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "PaymentTransaction" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('transaction-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('payout-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "descriptionFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "descriptionJson" TYPE JSONB USING "descriptionJson"::jsonb;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "descriptionJson" TYPE JSONB USING "descriptionJson"::jsonb;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('chat-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "bodyFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "bodyHtml" TEXT,
ADD COLUMN     "bodyJson" JSONB,
ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('message-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "contentFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "contentJson" TYPE JSONB USING "contentJson"::jsonb;

-- AlterTable
ALTER TABLE "BlogCategory" ADD COLUMN     "descriptionFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "descriptionJson" TYPE JSONB USING "descriptionJson"::jsonb;

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('favorite-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "ServiceReview" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('service-review-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "ProductReview" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('product-review-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "CustomerNote" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('customer-note-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "StaffRating" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('staff-rating-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "LoyaltyTransaction" ADD COLUMN     "descriptionFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('loyalty-'::text || encode(gen_random_bytes(8), 'hex'::text)),
ALTER COLUMN "descriptionJson" TYPE JSONB USING "descriptionJson"::jsonb;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('notification-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('audit-log-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "FeedPost" ADD COLUMN     "bodyFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "bodyHtml" TEXT,
ADD COLUMN     "bodyJson" JSONB,
ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('post-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "FeedComment" ADD COLUMN     "bodyFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "bodyHtml" TEXT,
ADD COLUMN     "bodyJson" JSONB,
ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('comment-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "bioFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "bioHtml" TEXT,
ADD COLUMN     "bioJson" JSONB;

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('media-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- AlterTable
ALTER TABLE "Salon" DROP COLUMN "slug",
ADD COLUMN     "descriptionFormat" "ContentFormat" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "descriptionJson" TYPE JSONB USING "descriptionJson"::jsonb;

-- AlterTable
ALTER TABLE "SalonMember" ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "slug" SET DEFAULT ('staff-'::text || encode(gen_random_bytes(8), 'hex'::text)),
ALTER COLUMN "slug" SET DATA TYPE VARCHAR(120);

-- AlterTable
ALTER TABLE "StaffLeave" ADD COLUMN     "slug" VARCHAR(120) NOT NULL DEFAULT ('staff-leave-'::text || encode(gen_random_bytes(8), 'hex'::text));

-- CreateIndex
CREATE UNIQUE INDEX "AiChat_slug_key" ON "AiChat"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AiMessage_slug_key" ON "AiMessage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_slug_key" ON "Appointment"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_slug_key" ON "Payment"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_slug_key" ON "PaymentTransaction"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_slug_key" ON "Payout"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_slug_key" ON "Conversation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_slug_key" ON "ChatMessage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_slug_key" ON "Favorite"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceReview_slug_key" ON "ServiceReview"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_slug_key" ON "ProductReview"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerNote_slug_key" ON "CustomerNote"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StaffRating_slug_key" ON "StaffRating"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyTransaction_slug_key" ON "LoyaltyTransaction"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_slug_key" ON "Notification"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AuditLog_slug_key" ON "AuditLog"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FeedPost_slug_key" ON "FeedPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FeedComment_slug_key" ON "FeedComment"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_slug_key" ON "MediaAsset"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StaffLeave_slug_key" ON "StaffLeave"("slug");

-- This checks storage shape only. HTML sanitization and editor validation belong
-- to the application; JSON is never rendered directly as trusted HTML.
CREATE FUNCTION has_rich_content(format "ContentFormat", plain_text TEXT, html TEXT, document JSONB)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE format
    WHEN 'TEXT' THEN length(btrim(COALESCE(plain_text, ''))) > 0
    WHEN 'HTML' THEN length(btrim(regexp_replace(COALESCE(html, ''), '<[^>]*>', '', 'g'))) > 0
    WHEN 'JSON' THEN document IS NOT NULL AND document NOT IN ('null'::jsonb, '{}'::jsonb, '[]'::jsonb, '""'::jsonb)
  END;
$$;
ALTER TABLE "FeedComment" DROP CONSTRAINT "FeedComment_body_check";
ALTER TABLE "FeedComment" ALTER COLUMN "body" SET DEFAULT '';
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_body_check"
  CHECK (has_rich_content("bodyFormat", "body", "bodyHtml", "bodyJson"));
ALTER TABLE "BlogPost" ALTER COLUMN "content" SET DEFAULT '';

CREATE OR REPLACE FUNCTION check_feed_post_content() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  affected_ids TEXT[];
  target_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'FeedPost' THEN
    affected_ids := ARRAY[NEW."id"];
  ELSIF TG_OP = 'DELETE' THEN
    affected_ids := ARRAY[OLD."postId"];
  ELSIF TG_OP = 'UPDATE' THEN
    affected_ids := ARRAY[OLD."postId", NEW."postId"];
  ELSE
    affected_ids := ARRAY[NEW."postId"];
  END IF;
  FOREACH target_id IN ARRAY affected_ids LOOP
    -- Serialize attachment edits before checking the final content state.
    PERFORM 1 FROM "FeedPost" WHERE "id" = target_id FOR UPDATE;
    IF EXISTS (
      SELECT 1 FROM "FeedPost" p WHERE p."id" = target_id
        AND p."status" = 'PUBLISHED' AND p."deletedAt" IS NULL
        AND NOT has_rich_content(p."bodyFormat", p."body", p."bodyHtml", p."bodyJson")
        AND NOT EXISTS (SELECT 1 FROM "FeedPostMedia" m WHERE m."postId" = p."id")
    ) THEN
      RAISE EXCEPTION 'Published posts require text or media' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION check_chat_message_content() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  affected_ids TEXT[];
  target_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'ChatMessage' THEN
    affected_ids := ARRAY[NEW."id"];
  ELSIF TG_OP = 'DELETE' THEN
    affected_ids := ARRAY[OLD."messageId"];
  ELSIF TG_OP = 'UPDATE' THEN
    affected_ids := ARRAY[OLD."messageId", NEW."messageId"];
  ELSE
    affected_ids := ARRAY[NEW."messageId"];
  END IF;
  FOREACH target_id IN ARRAY affected_ids LOOP
    PERFORM 1 FROM "ChatMessage" WHERE "id" = target_id FOR UPDATE;
    IF EXISTS (
      SELECT 1 FROM "ChatMessage" m WHERE m."id" = target_id AND m."deletedAt" IS NULL
        AND NOT has_rich_content(m."bodyFormat", m."body", m."bodyHtml", m."bodyJson")
        AND NOT EXISTS (SELECT 1 FROM "ChatMessageMedia" a WHERE a."messageId" = m."id")
    ) THEN
      RAISE EXCEPTION 'Messages require text or media' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "StaffLeave" ADD CONSTRAINT "StaffLeave_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "StaffRating" ADD CONSTRAINT "StaffRating_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "AiChat" ADD CONSTRAINT "AiChat_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "AiMessage" ADD CONSTRAINT "AiMessage_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120);
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_slug_reserved_check" CHECK ("slug" NOT IN ('admin', 'api', 'auth', 'login', 'register', 'settings', 'search', 'create', 'new', 'edit', 'me', 'feed', 'chat', 'salons', 'profiles'));
ALTER TABLE "SalonMember" ADD CONSTRAINT "SalonMember_slug_shape_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length("slug") BETWEEN 2 AND 120 AND "slug" NOT IN ('create', 'new', 'edit'));
COMMIT;
