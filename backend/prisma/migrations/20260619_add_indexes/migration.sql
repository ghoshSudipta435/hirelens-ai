-- Add missing indexes for query performance

-- JobPosting: improve active job listing queries and filtered searches
CREATE INDEX IF NOT EXISTS "JobPosting_status_createdAt_idx" ON "JobPosting"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "JobPosting_employmentType_locationMode_idx" ON "JobPosting"("employmentType", "locationMode");

-- Application: improve student application lookups and sort queries
CREATE INDEX IF NOT EXISTS "Application_resumeId_idx" ON "Application"("resumeId");
CREATE INDEX IF NOT EXISTS "Application_createdAt_idx" ON "Application"("createdAt");

-- MatchResult: improve candidate ranking queries
CREATE INDEX IF NOT EXISTS "MatchResult_score_idx" ON "MatchResult"("score");

-- InterviewQuestionSet: improve question set lookups by match
CREATE INDEX IF NOT EXISTS "InterviewQuestionSet_matchResultId_idx" ON "InterviewQuestionSet"("matchResultId");
