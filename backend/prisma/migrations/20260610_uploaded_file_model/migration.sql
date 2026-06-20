-- Rename the original upload table to match the public domain model requested for file storage.
ALTER TABLE "Upload" RENAME TO "UploadedFile";

ALTER TABLE "UploadedFile" RENAME COLUMN "userId" TO "ownerId";
ALTER TABLE "UploadedFile" RENAME COLUMN "originalName" TO "fileName";
ALTER TABLE "UploadedFile" RENAME COLUMN "mimeType" TO "fileType";
ALTER TABLE "UploadedFile" RENAME COLUMN "fileSizeBytes" TO "fileSize";
ALTER TABLE "UploadedFile" RENAME COLUMN "cloudinarySecureUrl" TO "fileUrl";

DROP INDEX IF EXISTS "Upload_userId_createdAt_idx";
DROP INDEX IF EXISTS "Upload_userId_deletedAt_idx";
DROP INDEX IF EXISTS "Upload_cloudinaryPublicId_key";

ALTER TABLE "UploadedFile"
  DROP COLUMN IF EXISTS "fileExtension",
  DROP COLUMN IF EXISTS "cloudinaryResourceType",
  DROP COLUMN IF EXISTS "updatedAt";

ALTER TABLE "UploadedFile" RENAME CONSTRAINT "Upload_pkey" TO "UploadedFile_pkey";
ALTER TABLE "UploadedFile" RENAME CONSTRAINT "Upload_userId_fkey" TO "UploadedFile_ownerId_fkey";

CREATE UNIQUE INDEX "UploadedFile_cloudinaryPublicId_key" ON "UploadedFile"("cloudinaryPublicId");
CREATE INDEX "UploadedFile_ownerId_createdAt_idx" ON "UploadedFile"("ownerId", "createdAt");
CREATE INDEX "UploadedFile_ownerId_deletedAt_idx" ON "UploadedFile"("ownerId", "deletedAt");

DROP TYPE IF EXISTS "UploadResourceType";

CREATE TYPE "UploadAuditEventType" AS ENUM ('UPLOAD_CREATE', 'UPLOAD_GET', 'UPLOAD_DELETE');

CREATE TABLE "UploadAuditEvent" (
  "id" TEXT NOT NULL,
  "eventType" "UploadAuditEventType" NOT NULL,
  "success" BOOLEAN NOT NULL,
  "ownerId" TEXT,
  "uploadedFileId" TEXT,
  "fileName" TEXT,
  "reason" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UploadAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UploadAuditEvent_eventType_createdAt_idx" ON "UploadAuditEvent"("eventType", "createdAt");
CREATE INDEX "UploadAuditEvent_ownerId_createdAt_idx" ON "UploadAuditEvent"("ownerId", "createdAt");
CREATE INDEX "UploadAuditEvent_uploadedFileId_createdAt_idx" ON "UploadAuditEvent"("uploadedFileId", "createdAt");

ALTER TABLE "UploadAuditEvent"
  ADD CONSTRAINT "UploadAuditEvent_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
