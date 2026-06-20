import { z } from 'zod';
import { ResumeStatus } from '@prisma/client';

export const createResumeSchema = z.object({
  uploadedFileId: z.string().min(1, 'Uploaded File ID is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
});

export const updateResumeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long').optional(),
  status: z.nativeEnum(ResumeStatus).optional(),
});

export const resumeParamsSchema = z.object({
  id: z.string().min(1, 'Resume ID is required'),
});

export const resumeListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export type CreateResumeInputDto = z.infer<typeof createResumeSchema>;
export type UpdateResumeInputDto = z.infer<typeof updateResumeSchema>;
