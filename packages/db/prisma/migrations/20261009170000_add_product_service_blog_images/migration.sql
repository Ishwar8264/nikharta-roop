-- Dedicated card and detail images; nullable for existing records.
ALTER TABLE "Product" ADD COLUMN "coverImage" TEXT, ADD COLUMN "bannerImage" TEXT;
ALTER TABLE "Service" ADD COLUMN "coverImage" TEXT, ADD COLUMN "bannerImage" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "bannerImage" TEXT;
