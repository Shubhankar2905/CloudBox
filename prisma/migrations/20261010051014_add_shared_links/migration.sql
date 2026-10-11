-- CreateTable
CREATE TABLE "SharedLink" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "allowDownload" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedLink_tokenHash_key" ON "SharedLink"("tokenHash");

-- CreateIndex
CREATE INDEX "SharedLink_fileId_idx" ON "SharedLink"("fileId");

-- CreateIndex
CREATE INDEX "SharedLink_createdById_idx" ON "SharedLink"("createdById");

-- AddForeignKey
ALTER TABLE "SharedLink" ADD CONSTRAINT "SharedLink_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedLink" ADD CONSTRAINT "SharedLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
