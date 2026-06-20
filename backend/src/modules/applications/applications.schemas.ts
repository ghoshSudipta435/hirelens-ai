import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const createApplicationSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  jobPostingId: z.string().min(1, 'Job posting ID is required'),
});

export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export const applicationParamsSchema = z.object({
  id: z.string().min(1, 'Application ID is required'),
});

export const applicationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  status: z.nativeEnum(ApplicationStatus).optional(),
  jobPostingId: z.string().optional(),
});

export type CreateApplicationInputDto = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInputDto = z.infer<typeof updateApplicationStatusSchema>;
