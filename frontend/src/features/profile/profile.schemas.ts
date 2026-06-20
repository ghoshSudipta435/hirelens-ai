import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))
  .pipe(z.string().url('Enter a valid URL').optional());

export const studentProfileFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  university: z.string().trim().min(2, 'University is required').max(160),
  degree: z.string().trim().min(2, 'Degree is required').max(160),
  graduationYear: z.coerce
    .number()
    .int('Graduation year must be a whole number')
    .min(1900)
    .max(2100),
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  bio: z.string().trim().min(10, 'Bio must be at least 10 characters').max(2000),
});

export const recruiterProfileFormSchema = z.object({
  companyName: z.string().trim().min(2, 'Company name is required').max(160),
  designation: z.string().trim().min(2, 'Designation is required').max(160),
  companyWebsite: optionalUrl,
  bio: z.string().trim().min(10, 'Bio must be at least 10 characters').max(2000),
});

export type StudentProfileSchemaValues = z.infer<typeof studentProfileFormSchema>;
export type StudentProfileFormInput = z.input<typeof studentProfileFormSchema>;
export type RecruiterProfileSchemaValues = z.infer<typeof recruiterProfileFormSchema>;
