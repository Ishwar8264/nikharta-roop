CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'USER');
CREATE TYPE "SalonMemberRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

-- Platform access is intentionally limited to normal users and super admins.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "PlatformRole"
  USING (
    CASE
      WHEN "role"::text = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"PlatformRole"
      ELSE 'USER'::"PlatformRole"
    END
  );
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- Invalid membership roles need an explicit business decision instead of a
-- silent privilege conversion.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "SalonMember"
    WHERE "role"::text IN ('SUPER_ADMIN', 'CUSTOMER')
  ) THEN
    RAISE EXCEPTION 'SalonMember contains platform-only roles; clean these rows before applying this migration';
  END IF;
END
$$;

ALTER TABLE "SalonMember"
  ALTER COLUMN "role" TYPE "SalonMemberRole"
  USING (
    CASE "role"::text
      WHEN 'SALON_OWNER' THEN 'OWNER'::"SalonMemberRole"
      WHEN 'MANAGER' THEN 'MANAGER'::"SalonMemberRole"
      WHEN 'STAFF' THEN 'STAFF'::"SalonMemberRole"
    END
  );

DROP TYPE "Role";

CREATE INDEX "SalonMember_salonId_role_idx" ON "SalonMember"("salonId", "role");
