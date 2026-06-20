-- Add soft delete support to Application and MatchResult

ALTER TABLE "Application" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Application" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "MatchResult" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "MatchResult" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");
CREATE INDEX "MatchResult_deletedAt_idx" ON "MatchResult"("deletedAt");
