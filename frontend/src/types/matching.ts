export type MatchResult = {
  id: string;
  contextType: 'APPLICATION' | 'PREVIEW' | 'AUTO_MATCH';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  resumeId: string;
  jobPostingId: string | null;
  applicationId: string | null;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  scoreVersion: string;
  createdAt: string;
  resume?: {
    id: string;
    title: string;
  };
  jobPosting?: {
    id: string;
    title: string;
    description: string;
    employmentType: string;
    locationMode: string;
    salaryMin: number | null;
    salaryMax: number | null;
    experienceYears: number | null;
    category: string | null;
    recruiter?: {
      name: string;
      recruiterProfile?: {
        companyName: string | null;
      }
    }
  };
  questionSets?: {
    id: string;
  }[];
};

export type PreviewMatchRequest = {
  resumeId: string;
  jobPostingId: string;
};

export type MatchListQuery = {
  page?: number;
  limit?: number;
  contextType?: string;
  minScore?: number;
  company?: string;
  locationMode?: string;
  employmentType?: string;
  skills?: string;
  salaryMin?: number;
  experienceYears?: number;
  category?: string;
  sort?: string;
};

export type AutoMatchStatusResponse = {
  total: number;
  completed: number;
  pending: number;
  failed: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
