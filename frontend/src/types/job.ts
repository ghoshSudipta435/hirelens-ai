export type JobPosting = {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  extractedSkills: string[];
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  locationMode: 'REMOTE' | 'HYBRID' | 'ONSITE';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  recruiter?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateJobRequest = {
  title: string;
  description: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  locationMode: 'REMOTE' | 'HYBRID' | 'ONSITE';
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
};

export type UpdateJobRequest = Partial<CreateJobRequest>;

export type JobListQuery = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  employmentType?: string;
  locationMode?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
