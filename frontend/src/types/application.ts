export type Application = {
  id: string;
  resumeId: string;
  jobPostingId: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  resume?: {
    id: string;
    title: string;
    version: number;
  };
  jobPosting?: {
    id: string;
    title: string;
    employmentType: string;
    locationMode: string;
  };
};

export type CreateApplicationRequest = {
  resumeId: string;
  jobPostingId: string;
};

export type ApplicationListQuery = {
  page?: number;
  limit?: number;
  status?: string;
  jobPostingId?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
