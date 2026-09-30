-- Keep existing descriptions; add the other supported formats.
ALTER TABLE "Coupon"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "descriptionHtml" TEXT,
  ADD COLUMN "descriptionJson" TEXT;

ALTER TABLE "LoyaltyTransaction"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "descriptionHtml" TEXT,
  ADD COLUMN "descriptionJson" TEXT;

ALTER TABLE "BlogCategory"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "descriptionHtml" TEXT,
  ADD COLUMN "descriptionJson" TEXT,
  DROP COLUMN "seoTitle",
  DROP COLUMN "seoDescription";

ALTER TABLE "Service"
  DROP COLUMN "seoTitle",
  DROP COLUMN "seoDescription";

ALTER TABLE "Product"
  DROP COLUMN "seoTitle",
  DROP COLUMN "seoDescription";

ALTER TABLE "BlogPost"
  DROP COLUMN "seoTitle",
  DROP COLUMN "seoDescription";
