CREATE TABLE "MultipartUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "partSize" INTEGER NOT NULL,
    "folderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "completedFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultipartUpload_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MultipartUpload_storageKey_key" ON "MultipartUpload"("storageKey");
CREATE UNIQUE INDEX "MultipartUpload_uploadId_key" ON "MultipartUpload"("uploadId");
CREATE INDEX "MultipartUpload_userId_status_idx" ON "MultipartUpload"("userId", "status");
