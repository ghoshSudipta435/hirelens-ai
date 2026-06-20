import { z } from 'zod';
import { EmploymentType, JobPostingStatus, LocationMode } from '@prisma/client';

export const createJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(1, 'Description is required').max(10000, 'Description is too long'),
  extractedSkills: z.array(z.string()).default([]),
  employmentType: z.nativeEnum(EmploymentType),
  locationMode: z.nativeEnum(LocationMode),
  status: z.nativeEnum(JobPostingStatus).optional(),
});

export const updateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().min(1, 'Description is required').max(10000, 'Description is too long').optional(),
  extractedSkills: z.array(z.string()).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  locationMode: z.nativeEnum(LocationMode).optional(),
  status: z.nativeEnum(JobPostingStatus).optional(),
});

export const jobParamsSchema = z.object({
  id: z.string().min(1, 'Job ID is required'),
});

export const jobListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  status: z.nativeEnum(JobPostingStatus).optional(),
  search: z.string().optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  locationMode: z.nativeEnum(LocationMode).optional(),
});

export type CreateJobInputDto = z.infer<typeof createJobSchema>;
export type UpdateJobInputDto = z.infer<typeof updateJobSchema>;
