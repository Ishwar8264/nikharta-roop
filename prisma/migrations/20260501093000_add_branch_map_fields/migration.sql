-- AlterTable
ALTER TABLE "Branch"
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7),
ADD COLUMN "placeId" VARCHAR(200);
