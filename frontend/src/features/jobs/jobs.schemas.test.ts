import { describe, expect, it } from 'vitest';
import { createJobFormSchema, updateJobFormSchema } from './jobs.schemas';

describe('Jobs schemas', () => {
  describe('createJobFormSchema', () => {
    it('validates a valid job posting', () => {
      const result = createJobFormSchema.safeParse({
        title: 'Software Engineer',
        description: 'We need a great engineer',
        employmentType: 'FULL_TIME',
        locationMode: 'REMOTE',
        status: 'ACTIVE',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createJobFormSchema.safeParse({
        title: '',
        description: 'desc',
        employmentType: 'FULL_TIME',
        locationMode: 'REMOTE',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid employment type', () => {
      const result = createJobFormSchema.safeParse({
        title: 'Engineer',
        description: 'desc',
        employmentType: 'INVALID',
        locationMode: 'REMOTE',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateJobFormSchema', () => {
    it('allows partial updates', () => {
      const result = updateJobFormSchema.safeParse({ title: 'New Title' });
      expect(result.success).toBe(true);
    });

    it('allows empty object', () => {
      const result = updateJobFormSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
