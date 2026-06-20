import { z } from 'zod';

export const createResumeFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  uploadedFileId: z.string().min(1, 'File is required'),
});

export const updateResumeFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
});

export type CreateResumeFormValues = z.infer<typeof createResumeFormSchema>;
export type UpdateResumeFormValues = z.infer<typeof updateResumeFormSchema>;
