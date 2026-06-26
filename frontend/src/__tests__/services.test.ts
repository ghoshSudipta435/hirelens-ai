import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/http-client', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockResponse = (data: any) => ({ data: { success: true, data } });
  return {
    apiClient: {
      post: vi.fn().mockResolvedValue(mockResponse({ id: '1', title: 'Test' })),
      get: vi.fn().mockResolvedValue(mockResponse({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 })),
      patch: vi.fn().mockResolvedValue(mockResponse({ id: '1', title: 'Updated' })),
      delete: vi.fn().mockResolvedValue({}),
    },
  };
});

describe('job service', () => {
  it('creates a job', async () => {
    const { createJob } = await import('@/services/job.service');
    const result = await createJob({
      title: 'Engineer',
      description: 'desc',
      employmentType: 'FULL_TIME',
      locationMode: 'REMOTE',
    });
    expect(result.title).toBe('Test');
  });

  it('lists jobs', async () => {
    const { listJobs } = await import('@/services/job.service');
    const result = await listJobs();
    expect(result.items).toEqual([]);
  });
});

describe('application service', () => {
  it('creates an application', async () => {
    const { createApplication } = await import('@/services/application.service');
    const result = await createApplication({ resumeId: 'r1', jobPostingId: 'j1' });
    expect(result).toBeDefined();
  });
});

describe('matching service', () => {
  it('previews a match', async () => {
    const { previewMatch } = await import('@/services/matching.service');
    const result = await previewMatch({ resumeId: 'r1', jobPostingId: 'j1' });
    expect(result).toBeDefined();
  });
});

describe('interview service', () => {
  it('generates questions', async () => {
    const { generateQuestions } = await import('@/services/interview.service');
    const result = await generateQuestions('match-1');
    expect(result).toBeDefined();
  });
});

describe('resume service', () => {
  it('creates a resume', async () => {
    const { createResume } = await import('@/services/resume.service');
    const result = await createResume({ uploadedFileId: 'f1', title: 'My Resume' });
    expect(result.title).toBe('Test');
  });
});
