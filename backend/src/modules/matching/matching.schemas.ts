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
  contextType: z.string().optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  company: z.string().optional(),
  locationMode: z.string().optional(),
  employmentType: z.string().optional(),
  skills: z.string().optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  experienceYears: z.coerce.number().int().min(0).optional(),
  category: z.string().optional(),
  sort: z.string().optional(),
});

export type PreviewMatchInputDto = z.infer<typeof previewMatchSchema>;
