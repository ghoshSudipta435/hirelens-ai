import { z } from 'zod';

export const previewMatchSchema = z.object({
  resumeId: z.string().min(1, 'Resume ID is required'),
  jobPostingId: z.string().min(1, 'Job posting ID is required'),
});

export const matchParamsSchema = z.object({
  id: z.string().min(1, 'Match ID is required'),
});

export const matchListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export type PreviewMatchInputDto = z.infer<typeof previewMatchSchema>;
