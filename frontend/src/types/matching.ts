export type MatchResult = {
  id: string;
  contextType: 'APPLICATION' | 'PREVIEW';
  resumeId: string;
  jobPostingId: string | null;
  applicationId: string | null;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  scoreVersion: string;
  createdAt: string;
  resume?: {
    id: string;
    title: string;
  };
  jobPosting?: {
    id: string;
    title: string;
  };
};

export type PreviewMatchRequest = {
  resumeId: string;
  jobPostingId: string;
};

export type MatchListQuery = {
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
