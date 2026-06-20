import { z } from 'zod';

export const generateQuestionsSchema = z.object({
  matchResultId: z.string().min(1, 'Match result ID is required'),
});

export const questionSetParamsSchema = z.object({
  id: z.string().min(1, 'Question set ID is required'),
});

export type GenerateQuestionsInputDto = z.infer<typeof generateQuestionsSchema>;
