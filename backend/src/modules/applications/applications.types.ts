import type { Application, JobPosting, Resume } from '@prisma/client';

export type ApplicationResponseDto = {
  id: string;
  resumeId: string;
  jobPostingId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
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

export type ApplicationWithRelations = Application & {
  resume?: Resume;
  jobPosting?: JobPosting;
};

export type ApplicationListQuery = {
  page?: number;
  limit?: number;
  status?: string;
  jobPostingId?: string;
};
