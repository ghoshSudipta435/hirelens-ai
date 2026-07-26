export type JobPosting = {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  extractedSkills: string[];
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  locationMode: 'REMOTE' | 'HYBRID' | 'ONSITE';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  salaryMin?: number | null;
  salaryMax?: number | null;
  experienceYears?: number | null;
  category?: string | null;
  recruiter?: {
    name: string;
    email: string;
    recruiterProfile?: {
      companyName: string | null;
    };
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
  company?: string;
  employmentType?: string;
  locationMode?: string;
  category?: string;
  salaryMin?: number;
  experienceYears?: number;
  sort?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
