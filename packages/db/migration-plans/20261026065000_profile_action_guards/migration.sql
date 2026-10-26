-- Candidate only. No application rollout or production migration is included.
BEGIN;

-- Draft salons may be created before their address/location is known.
ALTER TABLE "Salon"
  ALTER COLUMN "address" DROP NOT NULL,
  ALTER COLUMN "city" DROP NOT NULL,
  ALTER COLUMN "state" DROP NOT NULL,
  ALTER COLUMN "zip" DROP NOT NULL,
  ALTER COLUMN "lat" DROP NOT NULL,
  ALTER COLUMN "lng" DROP NOT NULL,
  ALTER COLUMN "images" SET DEFAULT ARRAY[]::text[],
  ALTER COLUMN "isActive" SET DEFAULT false;
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_live_details_check" CHECK (
  "status" <> 'LIVE' OR (
    COALESCE(length(btrim("address")) > 0 AND length(btrim("city")) > 0
      AND length(btrim("state")) > 0 AND length(btrim("zip")) > 0
      AND "lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180, false)
    AND "isActive" AND "deletedAt" IS NULL
  )
);
ALTER TABLE "Salon" ADD CONSTRAINT "Salon_coordinates_check" CHECK (
  ("lat" IS NULL AND "lng" IS NULL) OR
  ("lat" IS NOT NULL AND "lng" IS NOT NULL AND "lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180)
);

-- Provisioning is not enough: keep one onboarding row for every surviving profile.
CREATE OR REPLACE FUNCTION check_profile_activation() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_profile_id TEXT;
BEGIN
  IF TG_TABLE_NAME = 'Profile' THEN target_profile_id := NEW."id";
  ELSE target_profile_id := OLD."profileId";
  END IF;
  PERFORM 1 FROM "Profile" WHERE "id" = target_profile_id FOR UPDATE;
  IF EXISTS (
    SELECT 1 FROM "Profile" p WHERE p."id" = target_profile_id
    AND NOT EXISTS (SELECT 1 FROM "ProfileOnboarding" o WHERE o."profileId" = p."id"
      AND (p."status" <> 'ACTIVE' OR o."status" = 'COMPLETED'))
  ) THEN
    RAISE EXCEPTION 'Profiles require onboarding; active profiles require completion' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;

-- Serialize onboarding changes with profile activation before either can commit.
CREATE FUNCTION lock_onboarding_profile() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM "Profile" WHERE id = OLD."profileId" FOR UPDATE;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "ProfileOnboarding_lock_profile" BEFORE UPDATE OR DELETE ON "ProfileOnboarding"
FOR EACH ROW EXECUTE FUNCTION lock_onboarding_profile();

-- Preserve legacy User attribution; backfill the corresponding personal identity.
ALTER TABLE "Favorite" ADD COLUMN "actorProfileId" TEXT;
UPDATE "Favorite" a SET "actorProfileId" = p.id FROM "Profile" p WHERE p."personalUserId" = a."userId";
ALTER TABLE "Favorite" ALTER COLUMN "actorProfileId" SET NOT NULL;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_actorProfileId_fkey" FOREIGN KEY ("actorProfileId") REFERENCES "Profile"(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX "Favorite_actorProfileId_idx" ON "Favorite" ("actorProfileId");
ALTER TABLE "ServiceReview" ADD COLUMN "actorProfileId" TEXT;
UPDATE "ServiceReview" a SET "actorProfileId" = p.id FROM "Profile" p WHERE p."personalUserId" = a."userId";
ALTER TABLE "ServiceReview" ALTER COLUMN "actorProfileId" SET NOT NULL;
ALTER TABLE "ServiceReview" ADD CONSTRAINT "ServiceReview_actorProfileId_fkey" FOREIGN KEY ("actorProfileId") REFERENCES "Profile"(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX "ServiceReview_actorProfileId_idx" ON "ServiceReview" ("actorProfileId");
ALTER TABLE "ProductReview" ADD COLUMN "actorProfileId" TEXT;
UPDATE "ProductReview" a SET "actorProfileId" = p.id FROM "Profile" p WHERE p."personalUserId" = a."userId";
ALTER TABLE "ProductReview" ALTER COLUMN "actorProfileId" SET NOT NULL;
ALTER TABLE "ProductReview" ADD CONSTRAINT "ProductReview_actorProfileId_fkey" FOREIGN KEY ("actorProfileId") REFERENCES "Profile"(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX "ProductReview_actorProfileId_idx" ON "ProductReview" ("actorProfileId");
ALTER TABLE "BlogPost" ADD COLUMN "actorProfileId" TEXT;
UPDATE "BlogPost" a SET "actorProfileId" = p.id FROM "Profile" p WHERE p."personalUserId" = a."authorId";
ALTER TABLE "BlogPost" ALTER COLUMN "actorProfileId" SET NOT NULL;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_actorProfileId_fkey" FOREIGN KEY ("actorProfileId") REFERENCES "Profile"(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX "BlogPost_actorProfileId_idx" ON "BlogPost" ("actorProfileId");
ALTER TABLE "BlogComment" ADD COLUMN "actorProfileId" TEXT;
UPDATE "BlogComment" a SET "actorProfileId" = p.id FROM "Profile" p WHERE p."personalUserId" = a."userId";
ALTER TABLE "BlogComment" ALTER COLUMN "actorProfileId" SET NOT NULL;
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_actorProfileId_fkey" FOREIGN KEY ("actorProfileId") REFERENCES "Profile"(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
CREATE INDEX "BlogComment_actorProfileId_idx" ON "BlogComment" ("actorProfileId");
DROP INDEX "Favorite_userId_salonId_key";
CREATE UNIQUE INDEX "Favorite_actorProfileId_salonId_key" ON "Favorite" ("actorProfileId", "salonId");
DROP INDEX "Favorite_userId_serviceId_key";
CREATE UNIQUE INDEX "Favorite_actorProfileId_serviceId_key" ON "Favorite" ("actorProfileId", "serviceId");
DROP INDEX "Favorite_userId_productId_key";
CREATE UNIQUE INDEX "Favorite_actorProfileId_productId_key" ON "Favorite" ("actorProfileId", "productId");
DROP INDEX "ServiceReview_serviceId_userId_key";
CREATE UNIQUE INDEX "ServiceReview_serviceId_actorProfileId_key" ON "ServiceReview" ("serviceId", "actorProfileId");
DROP INDEX "ProductReview_productId_userId_key";
CREATE UNIQUE INDEX "ProductReview_productId_actorProfileId_key" ON "ProductReview" ("productId", "actorProfileId");

-- This checks the supplied audit pair. Trusted services must still derive the
-- operator from the session; SQL clients are not authenticated by these columns.
-- SHARE locks serialize successful writes against suspension and membership revocation.
CREATE FUNCTION assert_profile_operator(target_profile TEXT, target_user TEXT, require_active BOOLEAN, personal_only BOOLEAN)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE identity_row "Profile"%ROWTYPE;
BEGIN
  PERFORM 1 FROM "User" WHERE id = target_user AND status = 'ACTIVE' AND "deletedAt" IS NULL FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'An active account is required' USING ERRCODE = '23514'; END IF;
  SELECT * INTO identity_row FROM "Profile" WHERE id = target_profile FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Acting profile does not exist' USING ERRCODE = '23514'; END IF;
  IF identity_row.status IN ('SUSPENDED', 'ARCHIVED') OR (require_active AND identity_row.status <> 'ACTIVE') THEN
    RAISE EXCEPTION 'Acting profile is unavailable for this action' USING ERRCODE = '23514';
  END IF;
  IF personal_only AND identity_row.type <> 'PERSONAL' THEN
    RAISE EXCEPTION 'This action requires a personal profile' USING ERRCODE = '23514';
  END IF;
  IF identity_row.type = 'PERSONAL' THEN
    IF identity_row."personalUserId" IS DISTINCT FROM target_user THEN
      RAISE EXCEPTION 'Personal profile does not belong to operator' USING ERRCODE = '23514';
    END IF;
  ELSE
    PERFORM 1 FROM "Salon" WHERE id = identity_row."salonId" AND "deletedAt" IS NULL AND status <> 'ARCHIVED' FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Salon is unavailable' USING ERRCODE = '23514'; END IF;
    PERFORM 1 FROM "SalonMember" WHERE "salonId" = identity_row."salonId" AND "userId" = target_user FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Current salon membership is required' USING ERRCODE = '23514'; END IF;
  END IF;
END;
$$;

-- All configured writes retain their original profile and operator attribution.
-- Updates recheck availability; removal of membership never rewrites old history.
CREATE FUNCTION guard_profile_action() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  action_row JSONB := to_jsonb(NEW);
  needs_active BOOLEAN := true;
BEGIN
  IF TG_OP = 'UPDATE' AND (
    action_row ->> TG_ARGV[0] IS DISTINCT FROM to_jsonb(OLD) ->> TG_ARGV[0] OR
    action_row ->> TG_ARGV[1] IS DISTINCT FROM to_jsonb(OLD) ->> TG_ARGV[1]
  ) THEN
    RAISE EXCEPTION 'Action attribution cannot be reassigned' USING ERRCODE = '23514';
  END IF;
  IF TG_TABLE_NAME = 'FeedPost' THEN needs_active := NEW.status <> 'DRAFT'; END IF;
  IF TG_TABLE_NAME = 'BlogPost' THEN needs_active := NEW.published; END IF;
  PERFORM assert_profile_operator(action_row ->> TG_ARGV[0], action_row ->> TG_ARGV[1], needs_active, TG_ARGV[2]::boolean);
  RETURN NEW;
END;
$$;
CREATE TRIGGER "FeedPost_profile_action_guard" BEFORE INSERT OR UPDATE ON "FeedPost"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('authorProfileId', 'writtenByUserId', 'false');
CREATE TRIGGER "FeedComment_profile_action_guard" BEFORE INSERT OR UPDATE ON "FeedComment"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('authorProfileId', 'writtenByUserId', 'false');
CREATE TRIGGER "FeedLike_profile_action_guard" BEFORE INSERT OR UPDATE ON "FeedLike"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('profileId', 'performedByUserId', 'false');
CREATE TRIGGER "ChatMessage_profile_action_guard" BEFORE INSERT OR UPDATE ON "ChatMessage"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('senderProfileId', 'sentByUserId', 'false');
CREATE TRIGGER "ConversationReadState_profile_action_guard" BEFORE INSERT OR UPDATE ON "ConversationReadState"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('profileId', 'userId', 'false');
CREATE TRIGGER "Favorite_profile_action_guard" BEFORE INSERT OR UPDATE ON "Favorite"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('actorProfileId', 'userId', 'true');
CREATE TRIGGER "ServiceReview_profile_action_guard" BEFORE INSERT OR UPDATE ON "ServiceReview"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('actorProfileId', 'userId', 'true');
CREATE TRIGGER "ProductReview_profile_action_guard" BEFORE INSERT OR UPDATE ON "ProductReview"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('actorProfileId', 'userId', 'true');
CREATE TRIGGER "BlogPost_profile_action_guard" BEFORE INSERT OR UPDATE ON "BlogPost"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('actorProfileId', 'authorId', 'false');
CREATE TRIGGER "BlogComment_profile_action_guard" BEFORE INSERT OR UPDATE ON "BlogComment"
FOR EACH ROW EXECUTE FUNCTION guard_profile_action('actorProfileId', 'userId', 'false');

COMMIT;
