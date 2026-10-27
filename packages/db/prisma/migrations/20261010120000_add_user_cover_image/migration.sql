-- Add an optional profile cover without changing existing user records.
ALTER TABLE "User" ADD COLUMN "coverImage" TEXT;
