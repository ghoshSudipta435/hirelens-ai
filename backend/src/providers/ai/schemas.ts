import { z } from 'zod';

export const matchOutputSchema = z.object({
  score: z.number().int().min(0).max(100).default(0),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
});

export const interviewQuestionSchema = z.object({
  question: z.string().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  category: z.string().min(1),
});

export const interviewQuestionOutputSchema = z.object({
  questions: z.array(interviewQuestionSchema).default([]),
});

export const skillsOutputSchema = z.object({
  skills: z.array(z.string()).default([]),
});
