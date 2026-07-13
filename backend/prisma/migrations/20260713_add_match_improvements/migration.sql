-- Add improvements field to MatchResult for actionable resume improvement suggestions

ALTER TABLE "MatchResult" ADD COLUMN "improvements" TEXT[] NOT NULL DEFAULT '{}';
