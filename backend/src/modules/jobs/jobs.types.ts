import type { JobPosting } from '@prisma/client';

export type JobPostingResponseDto = {
  id: string;
  recruiterId: string;
  title: string;
  description: string;
  extractedSkills: string[];
  employmentType: string;
  locationMode: string;
  status: string;
  recruiter?: {
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type JobPostingListQuery = {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  employmentType?: string;
  locationMode?: string;
  company?: string;
  experienceYears?: number;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string;
  category?: string;
  sort?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
