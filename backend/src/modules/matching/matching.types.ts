import type { MatchResult } from '@prisma/client';

export type MatchResultResponseDto = {
  id: string;
  contextType: string;
  resumeId: string;
  jobPostingId: string | null;
  applicationId: string | null;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  scoreVersion: string;
  createdAt: Date;
  resume?: {
    id: string;
    title: string;
  };
  jobPosting?: {
    id: string;
    title: string;
  };
};

export type PreviewMatchInput = {
  resumeId: string;
  jobPostingId: string;
};

export type MatchListQuery = {
  page?: number;
  limit?: number;
};
