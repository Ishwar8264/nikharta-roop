-- Run with auth and application writes paused, after reviewing the deployment baseline.
-- This migration requires the pre-change Profile-aware schema, including the auth upgrade.
-- It never assigns a salon conversation to an arbitrarily selected owner/staff user.
BEGIN;
LOCK TABLE "User", "Salon", "SalonMember", "Profile", "ProfileOnboarding", "UserOnboarding", "LoyaltyWallet", "Favorite", "ServiceReview", "ProductReview", "BlogPost", "BlogComment", "FeedPost", "FeedComment", "FeedLike", "Conversation", "ConversationParticipant", "ChatMessage", "ConversationReadState" IN ACCESS EXCLUSIVE MODE;

-- Abort on ambiguity; do not drop rows, merge histories, or infer ownership.
DO $$
BEGIN
  IF current_schema() <> 'public' THEN RAISE EXCEPTION 'This migration is prepared for the public schema'; END IF;
  IF EXISTS (SELECT 1 FROM "Profile" WHERE
    (type='PERSONAL' AND ("personalUserId" IS NULL OR "salonId" IS NOT NULL)) OR
    (type='SALON' AND ("salonId" IS NULL OR "personalUserId" IS NOT NULL)))
  THEN RAISE EXCEPTION 'Profile ownership must be repaired before migration'; END IF;
  IF EXISTS (SELECT 1 FROM "Salon" salon LEFT JOIN "Profile" profile ON profile."salonId"=salon.id
    WHERE profile.id IS NULL OR profile.type<>'SALON' OR profile."displayName" IS NULL OR length(btrim(profile."displayName"))=0)
  THEN RAISE EXCEPTION 'Every salon needs an identified, named salon profile before migration'; END IF;
  IF EXISTS (SELECT 1 FROM "Salon" salon JOIN "Profile" profile ON profile."salonId"=salon.id
    WHERE (salon.status IN ('LIVE','TEMPORARILY_CLOSED') AND profile.status<>'ACTIVE')
      OR (salon.status<>'ARCHIVED' AND profile.status IN ('SUSPENDED','ARCHIVED')))
  THEN RAISE EXCEPTION 'Resolve hidden or suspended live salon identities before migration'; END IF;
  IF EXISTS (SELECT 1 FROM "Profile" profile JOIN "User" account ON account.id=profile."personalUserId"
    WHERE profile.type='PERSONAL' AND profile.status IN ('SUSPENDED','ARCHIVED') AND account.status='ACTIVE' AND account."deletedAt" IS NULL)
  THEN RAISE EXCEPTION 'Resolve personal-profile moderation against account status before migration'; END IF;
  IF EXISTS (SELECT 1 FROM "Conversation" conversation JOIN "Profile" action_record ON action_record.id=conversation."firstProfileId"
    JOIN "Profile" second_profile ON second_profile.id=conversation."secondProfileId" WHERE action_record.type<>'PERSONAL' OR second_profile.type<>'PERSONAL')
  THEN RAISE EXCEPTION 'Salon-addressed conversations require explicit user mapping before migration'; END IF;
  IF EXISTS (SELECT 1 FROM "ConversationParticipant" participant JOIN "Conversation" conversation ON conversation.id=participant."conversationId"
    WHERE participant."profileId" NOT IN (conversation."firstProfileId",conversation."secondProfileId")) OR EXISTS
    (SELECT 1 FROM "Conversation" conversation WHERE (SELECT count(*) FROM "ConversationParticipant" participant WHERE participant."conversationId"=conversation.id)<>2)
  THEN RAISE EXCEPTION 'Conversation participants must match both original parties'; END IF;
  IF EXISTS (SELECT 1 FROM "ChatMessage" message JOIN "Profile" profile ON profile.id=message."senderProfileId"
    WHERE profile.type<>'PERSONAL' OR profile."personalUserId" IS DISTINCT FROM message."sentByUserId") OR EXISTS
    (SELECT 1 FROM "ConversationReadState" read_state JOIN "Profile" profile ON profile.id=read_state."profileId"
    WHERE profile.type<>'PERSONAL' OR profile."personalUserId" IS DISTINCT FROM read_state."userId")
  THEN RAISE EXCEPTION 'Chat operator and personal-profile owner disagree'; END IF;
  IF EXISTS (SELECT 1 FROM "FeedPost" action_record JOIN "Profile" profile ON profile.id=action_record."authorProfileId"
    WHERE profile.type='PERSONAL' AND profile."personalUserId" IS DISTINCT FROM action_record."writtenByUserId")
  THEN RAISE EXCEPTION 'FeedPost has conflicting personal identity and operator attribution'; END IF;
  IF EXISTS (SELECT 1 FROM "FeedComment" action_record JOIN "Profile" profile ON profile.id=action_record."authorProfileId"
    WHERE profile.type='PERSONAL' AND profile."personalUserId" IS DISTINCT FROM action_record."writtenByUserId")
  THEN RAISE EXCEPTION 'FeedComment has conflicting personal identity and operator attribution'; END IF;
  IF EXISTS (SELECT 1 FROM "FeedLike" action_record JOIN "Profile" profile ON profile.id=action_record."profileId"
    WHERE profile.type='PERSONAL' AND profile."personalUserId" IS DISTINCT FROM action_record."performedByUserId")
  THEN RAISE EXCEPTION 'FeedLike has conflicting personal identity and operator attribution'; END IF;
  IF EXISTS (SELECT 1 FROM "Favorite" action_record JOIN "Profile" profile ON profile.id=action_record."actorProfileId"
    WHERE profile.type='PERSONAL' AND profile."personalUserId" IS DISTINCT FROM action_record."userId")
  THEN RAISE EXCEPTION 'Favorite has conflicting personal identity and operator attribution'; END IF;
  IF EXISTS (SELECT 1 FROM "ServiceReview" action_record JOIN "Profile" profile ON profile.id=action_record."actorProfileId"
    WHERE profile.type='PERSONAL' AND profile."personalUserId" IS DISTINCT FROM action_record."userId")
  THEN RAISE EXCEPTION 'ServiceReview has conflicting personal identity and operator attribution'; END IF;
  IF EXISTS (SELECT 1 FROM "ProductReview" action_record JOIN "Profile" profile ON profile.id=action_record."actorProfileId"
    WHERE profile.type='PERSONAL' AND profile."personalUserId" IS DISTINCT FROM action_record."userId")
  THEN RAISE EXCEPTION 'ProductReview has conflicting personal identity and operator attribution'; END IF;
  IF EXISTS (SELECT 1 FROM "BlogPost" action_record JOIN "Profile" profile ON profile.id=action_record."actorProfileId"
    WHERE profile.type='PERSONAL' AND profile."personalUserId" IS DISTINCT FROM action_record."authorId")
  THEN RAISE EXCEPTION 'BlogPost has conflicting personal identity and operator attribution'; END IF;
  IF EXISTS (SELECT 1 FROM "BlogComment" action_record JOIN "Profile" profile ON profile.id=action_record."actorProfileId"
    WHERE profile.type='PERSONAL' AND profile."personalUserId" IS DISTINCT FROM action_record."userId")
  THEN RAISE EXCEPTION 'BlogComment has conflicting personal identity and operator attribution'; END IF;
  IF EXISTS (SELECT 1 FROM "Favorite" WHERE "salonId" IS NOT NULL GROUP BY "userId","salonId" HAVING count(*)>1)
  THEN RAISE EXCEPTION 'Favorite would contain duplicate user actions; resolve without discarding history'; END IF;
  IF EXISTS (SELECT 1 FROM "Favorite" WHERE "serviceId" IS NOT NULL GROUP BY "userId","serviceId" HAVING count(*)>1)
  THEN RAISE EXCEPTION 'Favorite would contain duplicate user actions; resolve without discarding history'; END IF;
  IF EXISTS (SELECT 1 FROM "Favorite" WHERE "productId" IS NOT NULL GROUP BY "userId","productId" HAVING count(*)>1)
  THEN RAISE EXCEPTION 'Favorite would contain duplicate user actions; resolve without discarding history'; END IF;
  IF EXISTS (SELECT 1 FROM "ServiceReview" GROUP BY "serviceId","userId" HAVING count(*)>1)
  THEN RAISE EXCEPTION 'ServiceReview would contain duplicate user actions; resolve without discarding history'; END IF;
  IF EXISTS (SELECT 1 FROM "ProductReview" GROUP BY "productId","userId" HAVING count(*)>1)
  THEN RAISE EXCEPTION 'ProductReview would contain duplicate user actions; resolve without discarding history'; END IF;
  IF EXISTS (SELECT 1 FROM "FeedLike" GROUP BY "postId","performedByUserId" HAVING count(*)>1)
  THEN RAISE EXCEPTION 'FeedLike would contain duplicate user actions; resolve without discarding history'; END IF;
END;
$$;

-- Preserve the full original values, including obsolete profile onboarding, rich salon bios,
-- public salon attribution and old composite IDs. Archive is outside Prisma's public schema.
CREATE SCHEMA legacy_profile_identity_20261027;
REVOKE ALL ON SCHEMA legacy_profile_identity_20261027 FROM PUBLIC;
CREATE TABLE legacy_profile_identity_20261027."Snapshot" (entity TEXT NOT NULL, data JSONB NOT NULL);
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'Profile',to_jsonb(original_record) FROM "Profile" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'ProfileOnboarding',to_jsonb(original_record) FROM "ProfileOnboarding" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'Salon',to_jsonb(original_record) FROM "Salon" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'UserOnboarding',to_jsonb(original_record) FROM "UserOnboarding" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'LoyaltyWallet',to_jsonb(original_record) FROM "LoyaltyWallet" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'Favorite',to_jsonb(original_record) FROM "Favorite" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'ServiceReview',to_jsonb(original_record) FROM "ServiceReview" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'ProductReview',to_jsonb(original_record) FROM "ProductReview" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'BlogPost',to_jsonb(original_record) FROM "BlogPost" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'BlogComment',to_jsonb(original_record) FROM "BlogComment" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'FeedPost',to_jsonb(original_record) FROM "FeedPost" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'FeedComment',to_jsonb(original_record) FROM "FeedComment" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'FeedLike',to_jsonb(original_record) FROM "FeedLike" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'Conversation',to_jsonb(original_record) FROM "Conversation" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'ConversationParticipant',to_jsonb(original_record) FROM "ConversationParticipant" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'ChatMessage',to_jsonb(original_record) FROM "ChatMessage" original_record;
INSERT INTO legacy_profile_identity_20261027."Snapshot" SELECT 'ConversationReadState',to_jsonb(original_record) FROM "ConversationReadState" original_record;
CREATE INDEX "Snapshot_entity_idx" ON legacy_profile_identity_20261027."Snapshot"(entity);

-- Remove only the legacy identity hooks; content, reply, coordinate and financial checks remain.
DROP TRIGGER IF EXISTS "Profile_immutable_owner" ON "Profile";
DROP TRIGGER IF EXISTS "Conversation_immutable_pair" ON "Conversation";
DROP TRIGGER IF EXISTS "ConversationParticipant_pair_check" ON "ConversationParticipant";
DROP TRIGGER IF EXISTS "User_provision_identity" ON "User";
DROP TRIGGER IF EXISTS "Salon_provision_identity" ON "Salon";
DROP TRIGGER IF EXISTS "User_personal_profile_required" ON "User";
DROP TRIGGER IF EXISTS "Profile_personal_owner_required" ON "Profile";
DROP TRIGGER IF EXISTS "Profile_provision_onboarding" ON "Profile";
DROP TRIGGER IF EXISTS "Profile_activation_check" ON "Profile";
DROP TRIGGER IF EXISTS "ProfileOnboarding_activation_check" ON "ProfileOnboarding";
DROP TRIGGER IF EXISTS "ProfileOnboarding_immutable_identity" ON "ProfileOnboarding";
DROP TRIGGER IF EXISTS "ProfileOnboarding_lock_profile" ON "ProfileOnboarding";
DROP TRIGGER IF EXISTS "FeedPost_profile_action_guard" ON "FeedPost";
DROP TRIGGER IF EXISTS "FeedComment_profile_action_guard" ON "FeedComment";
DROP TRIGGER IF EXISTS "FeedLike_profile_action_guard" ON "FeedLike";
DROP TRIGGER IF EXISTS "ChatMessage_profile_action_guard" ON "ChatMessage";
DROP TRIGGER IF EXISTS "ConversationReadState_profile_action_guard" ON "ConversationReadState";
DROP TRIGGER IF EXISTS "Favorite_profile_action_guard" ON "Favorite";
DROP TRIGGER IF EXISTS "ServiceReview_profile_action_guard" ON "ServiceReview";
DROP TRIGGER IF EXISTS "ProductReview_profile_action_guard" ON "ProductReview";
DROP TRIGGER IF EXISTS "BlogPost_profile_action_guard" ON "BlogPost";
DROP TRIGGER IF EXISTS "BlogComment_profile_action_guard" ON "BlogComment";
DROP FUNCTION IF EXISTS preserve_profile_owner();
DROP FUNCTION IF EXISTS preserve_conversation_pair();
DROP FUNCTION IF EXISTS check_conversation_participant();
DROP FUNCTION IF EXISTS provision_user_identity();
DROP FUNCTION IF EXISTS provision_salon_identity();
DROP FUNCTION IF EXISTS check_personal_identity_exists();
DROP FUNCTION IF EXISTS provision_profile_onboarding();
DROP FUNCTION IF EXISTS check_profile_activation();
DROP FUNCTION IF EXISTS preserve_profile_onboarding_identity();
DROP FUNCTION IF EXISTS lock_onboarding_profile();
DROP FUNCTION IF EXISTS guard_profile_action();
DROP FUNCTION IF EXISTS allocate_profile_slug(TEXT);
DROP FUNCTION IF EXISTS assert_profile_operator(TEXT,TEXT,BOOLEAN,BOOLEAN);

ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_firstProfileId_fkey";
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_secondProfileId_fkey";
ALTER TABLE "ConversationParticipant" DROP CONSTRAINT IF EXISTS "ConversationParticipant_profileId_fkey";
ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_conversationId_senderProfileId_fkey";
ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_sentByUserId_fkey";
ALTER TABLE "ConversationReadState" DROP CONSTRAINT IF EXISTS "ConversationReadState_conversationId_profileId_fkey";
ALTER TABLE "BlogPost" DROP CONSTRAINT IF EXISTS "BlogPost_actorProfileId_fkey";
ALTER TABLE "BlogComment" DROP CONSTRAINT IF EXISTS "BlogComment_actorProfileId_fkey";
ALTER TABLE "Favorite" DROP CONSTRAINT IF EXISTS "Favorite_actorProfileId_fkey";
ALTER TABLE "ServiceReview" DROP CONSTRAINT IF EXISTS "ServiceReview_actorProfileId_fkey";
ALTER TABLE "ProductReview" DROP CONSTRAINT IF EXISTS "ProductReview_actorProfileId_fkey";
ALTER TABLE "FeedPost" DROP CONSTRAINT IF EXISTS "FeedPost_authorProfileId_fkey";
ALTER TABLE "FeedPost" DROP CONSTRAINT IF EXISTS "FeedPost_writtenByUserId_fkey";
ALTER TABLE "FeedComment" DROP CONSTRAINT IF EXISTS "FeedComment_authorProfileId_fkey";
ALTER TABLE "FeedComment" DROP CONSTRAINT IF EXISTS "FeedComment_writtenByUserId_fkey";
ALTER TABLE "FeedLike" DROP CONSTRAINT IF EXISTS "FeedLike_profileId_fkey";
ALTER TABLE "FeedLike" DROP CONSTRAINT IF EXISTS "FeedLike_performedByUserId_fkey";
ALTER TABLE "Profile" DROP CONSTRAINT IF EXISTS "Profile_personalUserId_fkey";
ALTER TABLE "Profile" DROP CONSTRAINT IF EXISTS "Profile_salonId_fkey";
ALTER TABLE "ProfileOnboarding" DROP CONSTRAINT IF EXISTS "ProfileOnboarding_profileId_fkey";

DROP INDEX IF EXISTS "Conversation_secondProfileId_idx";
DROP INDEX IF EXISTS "Conversation_firstProfileId_secondProfileId_key";
DROP INDEX IF EXISTS "ConversationParticipant_profileId_conversationId_idx";
DROP INDEX IF EXISTS "ChatMessage_conversationId_senderProfileId_idx";
DROP INDEX IF EXISTS "ChatMessage_sentByUserId_idx";
DROP INDEX IF EXISTS "ChatMessage_conversationId_sentByUserId_clientMessageId_key";
DROP INDEX IF EXISTS "ConversationReadState_userId_profileId_idx";
DROP INDEX IF EXISTS "BlogPost_actorProfileId_idx";
DROP INDEX IF EXISTS "BlogComment_actorProfileId_idx";
DROP INDEX IF EXISTS "Favorite_actorProfileId_idx";
DROP INDEX IF EXISTS "Favorite_actorProfileId_salonId_key";
DROP INDEX IF EXISTS "Favorite_actorProfileId_serviceId_key";
DROP INDEX IF EXISTS "Favorite_actorProfileId_productId_key";
DROP INDEX IF EXISTS "ServiceReview_actorProfileId_idx";
DROP INDEX IF EXISTS "ServiceReview_serviceId_actorProfileId_key";
DROP INDEX IF EXISTS "ProductReview_actorProfileId_idx";
DROP INDEX IF EXISTS "ProductReview_productId_actorProfileId_key";
DROP INDEX IF EXISTS "FeedPost_authorProfileId_status_createdAt_id_idx";
DROP INDEX IF EXISTS "FeedPost_writtenByUserId_idx";
DROP INDEX IF EXISTS "FeedComment_authorProfileId_idx";
DROP INDEX IF EXISTS "FeedComment_writtenByUserId_idx";
DROP INDEX IF EXISTS "FeedLike_profileId_createdAt_idx";
DROP INDEX IF EXISTS "FeedLike_performedByUserId_idx";

-- Restore listing identity to Salon without changing listing/verification state.
ALTER TABLE "Salon" ADD COLUMN "name" TEXT, ADD COLUMN "slug" VARCHAR(120),
  ADD COLUMN "coverImage" TEXT, ADD COLUMN "bannerImage" TEXT, ADD COLUMN "shortDescription" TEXT;
UPDATE "Salon" salon SET "name"=profile."displayName", "slug"=profile.slug, "coverImage"=profile.avatar,
  "bannerImage"=profile."coverImage", "shortDescription"=profile.bio FROM "Profile" profile WHERE profile."salonId"=salon.id;
ALTER TABLE "Salon" ALTER COLUMN "name" SET NOT NULL, ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "slug" SET DEFAULT ('salon-'::text || encode(gen_random_bytes(8),'hex'));
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_name_nonempty_check" CHECK (length(btrim(name))>0);

-- Only personal chat parties are mapped, with canonical user ordering.
UPDATE "Conversation" conversation SET "firstProfileId"=least(action_record."personalUserId",second_profile."personalUserId"),
  "secondProfileId"=greatest(action_record."personalUserId",second_profile."personalUserId")
  FROM "Profile" action_record,"Profile" second_profile WHERE action_record.id=conversation."firstProfileId" AND second_profile.id=conversation."secondProfileId";
UPDATE "ConversationParticipant" participant SET "profileId"=profile."personalUserId" FROM "Profile" profile WHERE participant."profileId"=profile.id;
ALTER TABLE "Conversation" RENAME COLUMN "firstProfileId" TO "firstUserId";
ALTER TABLE "Conversation" RENAME COLUMN "secondProfileId" TO "secondUserId";
ALTER TABLE "ConversationParticipant" RENAME COLUMN "profileId" TO "userId";
ALTER TABLE "ChatMessage" DROP COLUMN "senderProfileId";
ALTER TABLE "ChatMessage" RENAME COLUMN "sentByUserId" TO "senderId";
ALTER TABLE "ConversationReadState" DROP COLUMN "profileId";
ALTER TABLE "ConversationReadState" ADD PRIMARY KEY ("conversationId","userId");

-- Recorded operators become the sole user actors; archive retains their old public attribution.
ALTER TABLE "FeedPost" DROP COLUMN "authorProfileId";
ALTER TABLE "FeedPost" RENAME COLUMN "writtenByUserId" TO "authorId";
ALTER TABLE "FeedComment" DROP COLUMN "authorProfileId";
ALTER TABLE "FeedComment" RENAME COLUMN "writtenByUserId" TO "authorId";
ALTER TABLE "FeedLike" DROP COLUMN "profileId";
ALTER TABLE "FeedLike" RENAME COLUMN "performedByUserId" TO "userId";
ALTER TABLE "FeedLike" ADD PRIMARY KEY ("postId","userId");
ALTER TABLE "Favorite" DROP COLUMN "actorProfileId";
ALTER TABLE "ServiceReview" DROP COLUMN "actorProfileId";
ALTER TABLE "ProductReview" DROP COLUMN "actorProfileId";
ALTER TABLE "BlogPost" DROP COLUMN "actorProfileId";
ALTER TABLE "BlogComment" DROP COLUMN "actorProfileId";

DROP TABLE "ProfileOnboarding";
DELETE FROM "Profile" WHERE type='SALON';
ALTER TABLE "Profile" DROP CONSTRAINT IF EXISTS "Profile_owner_check";
ALTER TABLE "Profile" DROP COLUMN "type", DROP COLUMN "salonId";
ALTER TABLE "Profile" RENAME TO "UserProfile";
ALTER TABLE "UserProfile" RENAME COLUMN "personalUserId" TO "userId";
ALTER TABLE "UserProfile" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "UserProfile" RENAME CONSTRAINT "Profile_pkey" TO "UserProfile_pkey";
ALTER INDEX "Profile_personalUserId_key" RENAME TO "UserProfile_userId_key";
ALTER INDEX "Profile_slug_key" RENAME TO "UserProfile_slug_key";
ALTER TYPE "ProfileStatus" RENAME TO "UserProfileStatus";
DROP TYPE "ProfileType";
DROP TYPE "OnboardingStatus";

CREATE INDEX "Conversation_secondUserId_idx" ON "Conversation"("secondUserId");
CREATE UNIQUE INDEX "Conversation_firstUserId_secondUserId_key" ON "Conversation"("firstUserId", "secondUserId");
CREATE INDEX "ConversationParticipant_userId_conversationId_idx" ON "ConversationParticipant"("userId", "conversationId");
CREATE INDEX "ChatMessage_conversationId_senderId_idx" ON "ChatMessage"("conversationId", "senderId");
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");
CREATE UNIQUE INDEX "ChatMessage_conversationId_senderId_clientMessageId_key" ON "ChatMessage"("conversationId", "senderId", "clientMessageId");
CREATE INDEX "ConversationReadState_userId_idx" ON "ConversationReadState"("userId");
CREATE INDEX "BlogPost_authorId_idx" ON "BlogPost"("authorId");
CREATE INDEX "BlogComment_userId_idx" ON "BlogComment"("userId");
CREATE UNIQUE INDEX "Favorite_userId_salonId_key" ON "Favorite"("userId", "salonId");
CREATE UNIQUE INDEX "Favorite_userId_serviceId_key" ON "Favorite"("userId", "serviceId");
CREATE UNIQUE INDEX "Favorite_userId_productId_key" ON "Favorite"("userId", "productId");
CREATE INDEX "ServiceReview_userId_idx" ON "ServiceReview"("userId");
CREATE UNIQUE INDEX "ServiceReview_serviceId_userId_key" ON "ServiceReview"("serviceId", "userId");
CREATE INDEX "ProductReview_userId_idx" ON "ProductReview"("userId");
CREATE UNIQUE INDEX "ProductReview_productId_userId_key" ON "ProductReview"("productId", "userId");
CREATE INDEX "FeedPost_authorId_status_createdAt_id_idx" ON "FeedPost"("authorId", "status", "createdAt" DESC, "id");
CREATE INDEX "FeedPost_authorId_idx" ON "FeedPost"("authorId");
CREATE INDEX "FeedComment_authorId_idx" ON "FeedComment"("authorId");
CREATE INDEX "FeedLike_userId_createdAt_idx" ON "FeedLike"("userId", "createdAt");
CREATE INDEX "FeedLike_userId_idx" ON "FeedLike"("userId");
CREATE UNIQUE INDEX "Salon_slug_key" ON "Salon"("slug");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_firstUserId_fkey" FOREIGN KEY ("firstUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_secondUserId_fkey" FOREIGN KEY ("secondUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_senderId_fkey" FOREIGN KEY ("conversationId", "senderId") REFERENCES "ConversationParticipant"("conversationId", "userId") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_conversationId_userId_fkey" FOREIGN KEY ("conversationId", "userId") REFERENCES "ConversationParticipant"("conversationId", "userId") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "FeedLike" ADD CONSTRAINT "FeedLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Enforce the new individual-user identity contract for future writes.
ALTER TABLE "Conversation" DROP CONSTRAINT IF EXISTS "Conversation_canonical_pair_check";
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_canonical_pair_check" CHECK ("firstUserId"<"secondUserId");
CREATE FUNCTION preserve_user_profile_owner() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."userId" IS DISTINCT FROM OLD."userId" THEN
    RAISE EXCEPTION 'User profile ownership is immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "UserProfile_immutable_owner" BEFORE UPDATE ON "UserProfile"
  FOR EACH ROW EXECUTE FUNCTION preserve_user_profile_owner();
CREATE FUNCTION preserve_conversation_pair() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW."firstUserId",NEW."secondUserId") IS DISTINCT FROM (OLD."firstUserId",OLD."secondUserId") THEN
    RAISE EXCEPTION 'Conversation participants are immutable' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "Conversation_immutable_pair" BEFORE UPDATE ON "Conversation"
  FOR EACH ROW EXECUTE FUNCTION preserve_conversation_pair();
CREATE FUNCTION check_conversation_participant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Conversation" WHERE id=NEW."conversationId"
    AND NEW."userId" IN ("firstUserId","secondUserId")) THEN
    RAISE EXCEPTION 'User is not a party to this conversation' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "ConversationParticipant_pair_check" BEFORE INSERT OR UPDATE ON "ConversationParticipant"
  FOR EACH ROW EXECUTE FUNCTION check_conversation_participant();
CREATE FUNCTION guard_user_action() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actor TEXT := to_jsonb(NEW)->>TG_ARGV[0];
BEGIN
  IF TG_OP='UPDATE' AND actor IS DISTINCT FROM to_jsonb(OLD)->>TG_ARGV[0] THEN
    RAISE EXCEPTION 'Action attribution cannot be reassigned' USING ERRCODE='23514';
  END IF;
  PERFORM 1 FROM "User" WHERE id=actor AND status='ACTIVE' AND "deletedAt" IS NULL FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'An active account is required' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "FeedPost_user_action_guard" BEFORE INSERT OR UPDATE ON "FeedPost"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('authorId');
CREATE TRIGGER "FeedComment_user_action_guard" BEFORE INSERT OR UPDATE ON "FeedComment"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('authorId');
CREATE TRIGGER "FeedLike_user_action_guard" BEFORE INSERT OR UPDATE ON "FeedLike"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('userId');
CREATE TRIGGER "ChatMessage_user_action_guard" BEFORE INSERT OR UPDATE ON "ChatMessage"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('senderId');
CREATE TRIGGER "ConversationReadState_user_action_guard" BEFORE INSERT OR UPDATE ON "ConversationReadState"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('userId');
CREATE TRIGGER "Favorite_user_action_guard" BEFORE INSERT OR UPDATE ON "Favorite"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('userId');
CREATE TRIGGER "ServiceReview_user_action_guard" BEFORE INSERT OR UPDATE ON "ServiceReview"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('userId');
CREATE TRIGGER "ProductReview_user_action_guard" BEFORE INSERT OR UPDATE ON "ProductReview"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('userId');
CREATE TRIGGER "BlogPost_user_action_guard" BEFORE INSERT OR UPDATE ON "BlogPost"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('authorId');
CREATE TRIGGER "BlogComment_user_action_guard" BEFORE INSERT OR UPDATE ON "BlogComment"
  FOR EACH ROW EXECUTE FUNCTION guard_user_action('userId');

-- Account onboarding and wallets do not depend on a public profile or a partner preference.
CREATE FUNCTION provision_account_state() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "UserOnboarding" ("userId") VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO "LoyaltyWallet" ("userId",points,"updatedAt") VALUES (NEW.id,0,now()) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "User_provision_account_state" AFTER INSERT ON "User"
  FOR EACH ROW EXECUTE FUNCTION provision_account_state();

COMMIT;
