import type { UserRole } from '@prisma/client';
import { z } from 'zod';

const optionalUrlSchema = z.string().trim().url().max(2048).optional().nullable();

const studentProfileUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional().nullable(),
    headline: z.string().trim().min(2).max(140).optional().nullable(),
    university: z.string().trim().min(2).max(160).optional().nullable(),
    degree: z.string().trim().min(2).max(160).optional().nullable(),
    graduationYear: z.number().int().min(1900).max(2100).optional().nullable(),
    githubUrl: optionalUrlSchema,
    linkedinUrl: optionalUrlSchema,
    portfolioUrl: optionalUrlSchema,
    bio: z.string().trim().min(10).max(2000).optional().nullable(),
  })
  .strict()
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: 'At least one field must be provided',
  });

const recruiterProfileUpdateSchema = z
  .object({
    companyName: z.string().trim().min(2).max(160).optional().nullable(),
    companyWebsite: optionalUrlSchema,
    designation: z.string().trim().min(2).max(160).optional().nullable(),
    bio: z.string().trim().min(10).max(2000).optional().nullable(),
  })
  .strict()
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: 'At least one field must be provided',
  });

export const profileUserIdParamsSchema = z.object({
  userId: z.string().min(1).trim(),
});

export function parseProfileUpdateInput(role: UserRole, body: unknown) {
  if (role === 'STUDENT') {
    return studentProfileUpdateSchema.parse(body);
  }

  return recruiterProfileUpdateSchema.parse(body);
}

export type StudentProfileUpdateDto = z.infer<typeof studentProfileUpdateSchema>;
export type RecruiterProfileUpdateDto = z.infer<typeof recruiterProfileUpdateSchema>;
export type ProfileUserIdParamsDto = z.infer<typeof profileUserIdParamsSchema>;
