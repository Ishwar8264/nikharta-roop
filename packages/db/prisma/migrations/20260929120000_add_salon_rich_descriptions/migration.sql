-- Salon descriptions now support summary, plain text, rendered HTML, and
-- editor JSON. Existing plain-text descriptions remain in place.
ALTER TABLE "Salon"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "descriptionHtml" TEXT,
  ADD COLUMN "descriptionJson" TEXT,
  DROP COLUMN "seoTitle",
  DROP COLUMN "seoDescription";
