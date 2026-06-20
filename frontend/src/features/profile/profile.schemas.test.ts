import { describe, expect, it } from 'vitest';

import { recruiterProfileFormSchema, studentProfileFormSchema } from './profile.schemas';

describe('profile form schemas', () => {
  it('validates required student onboarding fields', () => {
    const result = studentProfileFormSchema.safeParse({
      fullName: 'A',
      university: '',
      degree: '',
      graduationYear: 1800,
      githubUrl: 'not-a-url',
      bio: 'short',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(5);
  });

  it('accepts valid recruiter onboarding fields', () => {
    const result = recruiterProfileFormSchema.safeParse({
      companyName: 'Acme Talent',
      designation: 'Hiring Manager',
      companyWebsite: 'https://example.com',
      bio: 'I hire early-career engineers for product teams.',
    });

    expect(result.success).toBe(true);
  });
});
