BEGIN;
ALTER TABLE "SalonMember" ADD COLUMN "slug" TEXT;
CREATE UNIQUE INDEX "SalonMember_salonId_slug_key" ON "SalonMember"("salonId", "slug");

-- Persist name-based URLs once; later name changes preserve the stored slug.
DO $$
DECLARE
  member RECORD;
  base TEXT;
  candidate TEXT;
  suffix INTEGER;
BEGIN
  FOR member IN
    SELECT m."id", m."salonId", COALESCE(NULLIF(BTRIM(m."name"), ''), u."name", 'member') AS name
    FROM "SalonMember" m JOIN "User" u ON u."id" = m."userId"
    ORDER BY m."id"
  LOOP
    base := LEFT(TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(member.name), '[^a-z0-9]+', '-', 'g')), 80);
    IF base = '' THEN base := 'member'; END IF;
    candidate := base;
    suffix := 1;
    WHILE candidate = 'create' OR candidate ~ '^[a-f0-9]{48}$'
      OR candidate ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
      OR EXISTS (SELECT 1 FROM "SalonMember" WHERE "salonId" = member."salonId" AND "slug" = candidate)
    LOOP
      suffix := suffix + 1;
      candidate := LEFT(base, 80 - LENGTH('-' || suffix::TEXT)) || '-' || suffix::TEXT;
    END LOOP;
    UPDATE "SalonMember" SET "slug" = candidate WHERE "id" = member."id";
  END LOOP;
END $$;
COMMIT;
