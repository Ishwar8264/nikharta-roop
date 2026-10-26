-- DESIGN ONLY: these candidates are not active application migrations.
BEGIN;

-- CreateEnum
CREATE TYPE "FeedPostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('PERSONAL', 'SALON');

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "firstProfileId" TEXT NOT NULL,
    "secondProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "conversationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("conversationId","profileId")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "conversationId" TEXT NOT NULL,
    "senderProfileId" TEXT NOT NULL,
    "sentByUserId" TEXT NOT NULL,
    "clientMessageId" VARCHAR(128) NOT NULL,
    "body" TEXT,
    "replyToId" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessageMedia" (
    "messageId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChatMessageMedia_pkey" PRIMARY KEY ("messageId","mediaId")
);

-- CreateTable
CREATE TABLE "ConversationReadState" (
    "conversationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationReadState_pkey" PRIMARY KEY ("conversationId","profileId","userId")
);

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "authorProfileId" TEXT NOT NULL,
    "writtenByUserId" TEXT NOT NULL,
    "body" TEXT,
    "status" "FeedPostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPostMedia" (
    "postId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "altText" TEXT,

    CONSTRAINT "FeedPostMedia_pkey" PRIMARY KEY ("postId","mediaId")
);

-- CreateTable
CREATE TABLE "FeedComment" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "postId" TEXT NOT NULL,
    "authorProfileId" TEXT NOT NULL,
    "writtenByUserId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedLike" (
    "postId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "performedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedLike_pkey" PRIMARY KEY ("postId","profileId")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL DEFAULT (encode(gen_random_bytes(24), 'hex'::text)),
    "type" "ProfileType" NOT NULL,
    "personalUserId" TEXT,
    "salonId" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "coverImage" TEXT,
    "bio" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOnboarding" (
    "userId" TEXT NOT NULL,
    "accountType" "AccountType",
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompletedAt" TIMESTAMP(3),
    "partnerCompletedAt" TIMESTAMP(3),
    "partnerTermsVersion" TEXT,
    "partnerTermsAcceptedAt" TIMESTAMP(3),
    "partnerEligibilityBackfilledAt" TIMESTAMP(3),

    CONSTRAINT "UserOnboarding_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "LoyaltyWallet" (
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyWallet_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "Conversation_secondProfileId_idx" ON "Conversation"("secondProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_firstProfileId_secondProfileId_key" ON "Conversation"("firstProfileId", "secondProfileId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_profileId_conversationId_idx" ON "ConversationParticipant"("profileId", "conversationId");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_id_idx" ON "ChatMessage"("conversationId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_senderProfileId_idx" ON "ChatMessage"("conversationId", "senderProfileId");

-- CreateIndex
CREATE INDEX "ChatMessage_sentByUserId_idx" ON "ChatMessage"("sentByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_conversationId_id_key" ON "ChatMessage"("conversationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_conversationId_sentByUserId_clientMessageId_key" ON "ChatMessage"("conversationId", "sentByUserId", "clientMessageId");

-- CreateIndex
CREATE INDEX "ChatMessageMedia_mediaId_idx" ON "ChatMessageMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessageMedia_messageId_position_key" ON "ChatMessageMedia"("messageId", "position");

-- CreateIndex
CREATE INDEX "ConversationReadState_userId_profileId_idx" ON "ConversationReadState"("userId", "profileId");

-- CreateIndex
CREATE INDEX "ConversationReadState_conversationId_lastReadMessageId_idx" ON "ConversationReadState"("conversationId", "lastReadMessageId");

-- CreateIndex
CREATE INDEX "FeedPost_status_publishedAt_id_idx" ON "FeedPost"("status", "publishedAt" DESC, "id");

-- CreateIndex
CREATE INDEX "FeedPost_authorProfileId_status_createdAt_id_idx" ON "FeedPost"("authorProfileId", "status", "createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "FeedPost_writtenByUserId_idx" ON "FeedPost"("writtenByUserId");

-- CreateIndex
CREATE INDEX "FeedPostMedia_mediaId_idx" ON "FeedPostMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedPostMedia_postId_position_key" ON "FeedPostMedia"("postId", "position");

-- CreateIndex
CREATE INDEX "FeedComment_postId_parentId_createdAt_id_idx" ON "FeedComment"("postId", "parentId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "FeedComment_authorProfileId_idx" ON "FeedComment"("authorProfileId");

-- CreateIndex
CREATE INDEX "FeedComment_writtenByUserId_idx" ON "FeedComment"("writtenByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedComment_postId_id_key" ON "FeedComment"("postId", "id");

-- CreateIndex
CREATE INDEX "FeedLike_profileId_createdAt_idx" ON "FeedLike"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedLike_performedByUserId_idx" ON "FeedLike"("performedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_personalUserId_key" ON "Profile"("personalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_salonId_key" ON "Profile"("salonId");

-- CreateIndex
CREATE INDEX "Otp_userId_channel_purpose_createdAt_idx" ON "Otp"("userId", "channel", "purpose", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Otp_expiresAt_idx" ON "Otp"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_firstProfileId_fkey" FOREIGN KEY ("firstProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_secondProfileId_fkey" FOREIGN KEY ("secondProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_senderProfileId_fkey" FOREIGN KEY ("conversationId", "senderProfileId") REFERENCES "ConversationParticipant"("conversationId", "profileId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sentByUserId_fkey" FOREIGN KEY ("sentByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_replyToId_fkey" FOREIGN KEY ("conversationId", "replyToId") REFERENCES "ChatMessage"("conversationId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatMessageMedia" ADD CONSTRAINT "ChatMessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ChatMessageMedia" ADD CONSTRAINT "ChatMessageMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_conversationId_profileId_fkey" FOREIGN KEY ("conversationId", "profileId") REFERENCES "ConversationParticipant"("conversationId", "profileId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_conversationId_lastReadMessageId_fkey" FOREIGN KEY ("conversationId", "lastReadMessageId") REFERENCES "ChatMessage"("conversationId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_authorProfileId_fkey" FOREIGN KEY ("authorProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_writtenByUserId_fkey" FOREIGN KEY ("writtenByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedPostMedia" ADD CONSTRAINT "FeedPostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedPostMedia" ADD CONSTRAINT "FeedPostMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_authorProfileId_fkey" FOREIGN KEY ("authorProfileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_writtenByUserId_fkey" FOREIGN KEY ("writtenByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_postId_parentId_fkey" FOREIGN KEY ("postId", "parentId") REFERENCES "FeedComment"("postId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_personalUserId_fkey" FOREIGN KEY ("personalUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "UserOnboarding" ADD CONSTRAINT "UserOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "LoyaltyWallet" ADD CONSTRAINT "LoyaltyWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
-- Cross-model invariants not expressible in Prisma's schema language.
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_owner_check" CHECK (
  ("type" = 'PERSONAL' AND "personalUserId" IS NOT NULL AND "salonId" IS NULL)
  OR ("type" = 'SALON' AND "salonId" IS NOT NULL AND "personalUserId" IS NULL)
);
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_ordered_pair_check"
  CHECK ("firstProfileId" COLLATE "C" < "secondProfileId" COLLATE "C");
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_publication_check"
  CHECK ("status" <> 'PUBLISHED' OR "publishedAt" IS NOT NULL);
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_body_check"
  CHECK (length(btrim("body")) > 0);
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_not_self_reply_check"
  CHECK ("parentId" IS NULL OR "parentId" <> "id");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_not_self_reply_check"
  CHECK ("replyToId" IS NULL OR "replyToId" <> "id");
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_client_key_check"
  CHECK (length(btrim("clientMessageId")) > 0);
ALTER TABLE "FeedPostMedia" ADD CONSTRAINT "FeedPostMedia_position_check" CHECK ("position" >= 0);
ALTER TABLE "ChatMessageMedia" ADD CONSTRAINT "ChatMessageMedia_position_check" CHECK ("position" >= 0);

-- Public identities cannot be reassigned: historical authorship must stay true.
CREATE FUNCTION preserve_profile_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW."type", NEW."personalUserId", NEW."salonId") IS DISTINCT FROM
     (OLD."type", OLD."personalUserId", OLD."salonId") THEN
    RAISE EXCEPTION 'Profile ownership is immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Profile_immutable_owner" BEFORE UPDATE ON "Profile"
  FOR EACH ROW EXECUTE FUNCTION preserve_profile_owner();

-- A direct conversation always refers to the original two public identities.
CREATE FUNCTION preserve_conversation_pair() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW."firstProfileId", NEW."secondProfileId") IS DISTINCT FROM
     (OLD."firstProfileId", OLD."secondProfileId") THEN
    RAISE EXCEPTION 'Conversation participants are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Conversation_immutable_pair" BEFORE UPDATE ON "Conversation"
  FOR EACH ROW EXECUTE FUNCTION preserve_conversation_pair();

CREATE FUNCTION check_conversation_participant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "Conversation" WHERE "id" = NEW."conversationId"
      AND NEW."profileId" IN ("firstProfileId", "secondProfileId")
  ) THEN
    RAISE EXCEPTION 'Profile is not a party to this conversation' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "ConversationParticipant_pair_check"
  BEFORE INSERT OR UPDATE ON "ConversationParticipant"
  FOR EACH ROW EXECUTE FUNCTION check_conversation_participant();

-- Validate text-or-media at commit, allowing media-only content to be inserted
-- together with its attachments. Deleting the last attachment is checked too.
CREATE FUNCTION check_feed_post_content() RETURNS trigger LANGUAGE plpgsql AS $$
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
        AND length(btrim(COALESCE(p."body", ''))) = 0
        AND NOT EXISTS (SELECT 1 FROM "FeedPostMedia" m WHERE m."postId" = p."id")
    ) THEN
      RAISE EXCEPTION 'Published posts require text or media' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER "FeedPost_content_check"
  AFTER INSERT OR UPDATE ON "FeedPost" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_feed_post_content();
CREATE CONSTRAINT TRIGGER "FeedPostMedia_content_check"
  AFTER INSERT OR UPDATE OR DELETE ON "FeedPostMedia" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_feed_post_content();

CREATE FUNCTION check_chat_message_content() RETURNS trigger LANGUAGE plpgsql AS $$
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
        AND length(btrim(COALESCE(m."body", ''))) = 0
        AND NOT EXISTS (SELECT 1 FROM "ChatMessageMedia" a WHERE a."messageId" = m."id")
    ) THEN
      RAISE EXCEPTION 'Messages require text or media' USING ERRCODE = '23514';
    END IF;
  END LOOP;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER "ChatMessage_content_check"
  AFTER INSERT OR UPDATE ON "ChatMessage" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_chat_message_content();
CREATE CONSTRAINT TRIGGER "ChatMessageMedia_content_check"
  AFTER INSERT OR UPDATE OR DELETE ON "ChatMessageMedia" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_chat_message_content();


ALTER TABLE "Profile" ADD CONSTRAINT "Profile_coordinates_check" CHECK (
  ("lat" IS NULL AND "lng" IS NULL)
  OR ("lat" IS NOT NULL AND "lng" IS NOT NULL AND "lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180)
);
ALTER TABLE "LoyaltyWallet" ADD CONSTRAINT "LoyaltyWallet_nonnegative_balance_check" CHECK ("points" >= 0);

-- Copy public fields before any legacy columns are removed. Never invent
-- historical verification/consent dates or replace existing identifiers.
INSERT INTO "Profile" ("type", "personalUserId", "name", "avatar", "coverImage", "bio", "lat", "lng")
SELECT 'PERSONAL', "id", "name", "avatar", "coverImage", "bio", "lat", "lng" FROM "User";
INSERT INTO "Profile" ("type", "salonId", "name", "avatar", "coverImage", "bio")
SELECT 'SALON', "id", "name", "coverImage", "bannerImage", "shortDescription" FROM "Salon";
INSERT INTO "UserOnboarding" (
  "userId", "accountType", "isOnboarded", "onboardingCompletedAt", "partnerCompletedAt",
  "partnerTermsVersion", "partnerTermsAcceptedAt", "partnerEligibilityBackfilledAt"
)
SELECT "id", "accountType", "isOnboarded", "onboardingCompletedAt", "partnerCompletedAt",
       "partnerTermsVersion", "partnerTermsAcceptedAt", "partnerEligibilityBackfilledAt" FROM "User";
INSERT INTO "LoyaltyWallet" ("userId", "points", "updatedAt")
SELECT "id", "loyaltyPoints", now() FROM "User";

-- Every creation path (registration, OAuth, staff invitation, imports) gets
-- one personal identity and default business state in the inserting transaction.
-- Public display fields are written to Profile by the future application code.
CREATE FUNCTION provision_user_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "Profile" ("type", "personalUserId") VALUES ('PERSONAL', NEW."id");
  INSERT INTO "UserOnboarding" ("userId") VALUES (NEW."id");
  INSERT INTO "LoyaltyWallet" ("userId", "points", "updatedAt") VALUES (NEW."id", 0, now());
  RETURN NEW;
END;
$$;
CREATE TRIGGER "User_provision_identity" AFTER INSERT ON "User"
  FOR EACH ROW EXECUTE FUNCTION provision_user_identity();

CREATE FUNCTION provision_salon_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "Profile" ("type", "salonId") VALUES ('SALON', NEW."id");
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Salon_provision_identity" AFTER INSERT ON "Salon"
  FOR EACH ROW EXECUTE FUNCTION provision_salon_identity();

-- Do not allow an active user to lose their personal identity. Deferral still
-- permits an explicit, complete hard-deletion transaction where history allows it.
CREATE FUNCTION check_personal_identity_exists() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_user_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'User' THEN target_user_id := NEW."id";
  ELSE target_user_id := OLD."personalUserId";
  END IF;
  PERFORM 1 FROM "User" WHERE "id" = target_user_id FOR UPDATE;
  IF target_user_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM "User" u WHERE u."id" = target_user_id AND u."deletedAt" IS NULL
      AND NOT EXISTS (SELECT 1 FROM "Profile" p WHERE p."personalUserId" = u."id")
  ) THEN
    RAISE EXCEPTION 'Active users require a personal profile' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER "User_personal_profile_required"
  AFTER INSERT OR UPDATE ON "User" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_personal_identity_exists();
CREATE CONSTRAINT TRIGGER "Profile_personal_owner_required"
  AFTER DELETE ON "Profile" DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_personal_identity_exists();

ALTER TABLE "Account" ADD COLUMN "issuer" TEXT;

COMMIT;
