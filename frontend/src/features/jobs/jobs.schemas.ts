import { z } from 'zod';

export const createJobFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(10000, 'Description too long'),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
  locationMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']),
  status: z.enum(['DRAFT', 'ACTIVE']).optional(),
});

export const updateJobFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().min(1, 'Description is required').max(10000, 'Description too long').optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  locationMode: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
});

export type CreateJobFormValues = z.infer<typeof createJobFormSchema>;
export type UpdateJobFormValues = z.infer<typeof updateJobFormSchema>;
