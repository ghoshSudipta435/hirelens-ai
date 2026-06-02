import { z } from 'zod';

export const uploadParamsSchema = z.object({
  id: z.string().min(1).trim(),
});

export type UploadParamsDto = z.infer<typeof uploadParamsSchema>;
