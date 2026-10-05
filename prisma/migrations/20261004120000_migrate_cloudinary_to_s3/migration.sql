-- Existing Cloudinary-backed file metadata is intentionally discarded.
DELETE FROM "File";

-- Replace Cloudinary identifiers with the private S3 object key.
ALTER TABLE "File"
    DROP COLUMN "cloudinaryId",
    DROP COLUMN "cloudinaryUrl",
    ADD COLUMN "storageKey" TEXT NOT NULL;

CREATE UNIQUE INDEX "File_storageKey_key" ON "File"("storageKey");
