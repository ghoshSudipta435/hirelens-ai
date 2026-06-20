import { describe, expect, it } from 'vitest';
import { createResumeFormSchema, updateResumeFormSchema } from './resumes.schemas';

describe('Resumes schemas', () => {
  describe('createResumeFormSchema', () => {
    it('validates valid input', () => {
      const result = createResumeFormSchema.safeParse({
        title: 'My Resume',
        uploadedFileId: 'file-123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = createResumeFormSchema.safeParse({
        title: '',
        uploadedFileId: 'file-123',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateResumeFormSchema', () => {
    it('allows partial update', () => {
      const result = updateResumeFormSchema.safeParse({ status: 'ACTIVE' });
      expect(result.success).toBe(true);
    });
  });
});
