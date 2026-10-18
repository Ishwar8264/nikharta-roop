-- Separate salon card and page images from the gallery.
ALTER TABLE "Salon"
ADD COLUMN "coverImage" TEXT,
ADD COLUMN "bannerImage" TEXT;
