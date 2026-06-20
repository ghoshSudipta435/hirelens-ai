import { z } from 'zod';

export const uploadParamsSchema = z.object({
  id: z.string().min(1).trim(),
});

export const uploadListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
});

export type UploadParamsDto = z.infer<typeof uploadParamsSchema>;
