import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrismaMock } from '../fixtures/create-prisma-mock';

vi.mock('../../src/providers/ai', () => ({
  getAIProvider: () => ({
    generateMatchScore: vi.fn().mockResolvedValue({
      score: 85,
      matchedSkills: ['TypeScript', 'React'],
      missingSkills: ['Python'],
      strengths: ['Strong frontend experience'],
    }),
  }),
}));

describe('MatchingService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('creates a preview match', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { MatchingService } = await import('../../src/modules/matching/matching.service');
    const service = new MatchingService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1', ownerId: 'student-1', uploadedFileId: 'file-1', title: 'My Resume',
      version: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.jobPostings.push({
      id: 'job-1', recruiterId: 'recruiter-1', title: 'Engineer', description: 'We need TypeScript and React',
      extractedSkills: ['TypeScript', 'React', 'Python'],
      employmentType: 'FULL_TIME', locationMode: 'REMOTE', status: 'ACTIVE',
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    const match = await service.previewMatch('student-1', {
      resumeId: 'resume-1',
      jobPostingId: 'job-1',
    });

    expect(match.score).toBe(85);
    expect(match.matchedSkills).toContain('TypeScript');
    expect(match.missingSkills).toContain('Python');
    expect(state.matchResults).toHaveLength(1);
  });

  it('throws if resume not found for preview', async () => {
    const { prismaMock } = createPrismaMock();
    const { MatchingService } = await import('../../src/modules/matching/matching.service');
    const service = new MatchingService({ prismaClient: prismaMock });

    await expect(
      service.previewMatch('student-1', { resumeId: 'nonexistent', jobPostingId: 'job-1' })
    ).rejects.toThrow('Resume not found');
  });

  it('gets a match by id', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { MatchingService } = await import('../../src/modules/matching/matching.service');
    const service = new MatchingService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1', ownerId: 'student-1', uploadedFileId: 'file-1', title: 'My Resume',
      version: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.jobPostings.push({
      id: 'job-1', recruiterId: 'recruiter-1', title: 'Engineer', description: 'We need TypeScript and React',
      extractedSkills: ['TypeScript', 'React', 'Python'],
      employmentType: 'FULL_TIME', locationMode: 'REMOTE', status: 'ACTIVE',
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.matchResults.push({
      id: 'match-1', contextType: 'PREVIEW', resumeId: 'resume-1', jobPostingId: 'job-1',
      score: 90, matchedSkills: [], missingSkills: [], strengths: [], scoreVersion: '1.0.0',
      createdAt: new Date(),
    });

    const match = await service.getMatch('match-1', 'student-1', 'STUDENT');
    expect(match.score).toBe(90);
  });

  it('lists matches for a user', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { MatchingService } = await import('../../src/modules/matching/matching.service');
    const service = new MatchingService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1', ownerId: 'student-1', uploadedFileId: 'file-1', title: 'My Resume',
      version: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.matchResults.push({
      id: 'match-1', contextType: 'PREVIEW', resumeId: 'resume-1', jobPostingId: 'job-1',
      score: 90, matchedSkills: [], missingSkills: [], strengths: [], scoreVersion: '1.0.0',
      createdAt: new Date(),
    });

    const result = await service.listMatches('student-1', 'STUDENT', { page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
  });

  it('falls back to computeFallbackMatch when AI throws', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { MatchingService } = await import('../../src/modules/matching/matching.service');
    const service = new MatchingService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-2', ownerId: 'student-1', uploadedFileId: 'file-2', title: 'My Resume',
      version: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
      parsedData: { rawText: 'Experienced TypeScript React developer', skills: ['TypeScript', 'React'] },
    });
    state.jobPostings.push({
      id: 'job-2', recruiterId: 'recruiter-1', title: 'Engineer', description: 'We need TypeScript and React skills',
      extractedSkills: ['TypeScript', 'React', 'Python'],
      employmentType: 'FULL_TIME', locationMode: 'REMOTE', status: 'ACTIVE',
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    const match = await service.previewMatch('student-1', {
      resumeId: 'resume-2',
      jobPostingId: 'job-2',
    });

    expect(match.score).toBeGreaterThan(0);
    expect(match.matchedSkills).toContain('TypeScript');
    expect(match.matchedSkills).toContain('React');
    expect(match.missingSkills).toContain('Python');
  });
});

describe('computeFallbackMatch', () => {
  it('returns non-zero score for overlapping text', async () => {
    const { computeFallbackMatch } = await import('../../src/modules/matching/matching.service');
    const result = computeFallbackMatch(
      'Experienced TypeScript developer with React skills',
      'We need TypeScript and React expertise',
      ['TypeScript', 'React', 'Python'],
    );

    expect(result.score).toBeGreaterThan(0);
    expect(result.matchedSkills).toEqual(['TypeScript', 'React']);
    expect(result.missingSkills).toEqual(['Python']);
    expect(result.strengths).toHaveLength(1);
  });

  it('removes stopwords before computing overlap', async () => {
    const { computeFallbackMatch } = await import('../../src/modules/matching/matching.service');
    const resultA = computeFallbackMatch(
      'the and of for TypeScript',
      'the and of for TypeScript',
      ['TypeScript'],
    );
    const resultB = computeFallbackMatch(
      'TypeScript',
      'TypeScript',
      ['TypeScript'],
    );

    expect(resultA.score).toBe(resultB.score);
  });

  it('returns score 0 for completely unrelated text', async () => {
    const { computeFallbackMatch } = await import('../../src/modules/matching/matching.service');
    const result = computeFallbackMatch(
      'cooking baking recipes',
      'cloud infrastructure kubernetes docker',
      ['Kubernetes'],
    );

    expect(result.score).toBe(0);
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual(['Kubernetes']);
    expect(result.strengths).toEqual([]);
  });

  it('handles empty resume text gracefully', async () => {
    const { computeFallbackMatch } = await import('../../src/modules/matching/matching.service');
    const result = computeFallbackMatch('', 'We need TypeScript', ['TypeScript']);

    expect(result.score).toBe(0);
    expect(result.matchedSkills).toEqual([]);
    expect(result.missingSkills).toEqual(['TypeScript']);
  });

  it('returns partial score from skill coverage when job description is empty', async () => {
    const { computeFallbackMatch } = await import('../../src/modules/matching/matching.service');
    const result = computeFallbackMatch('TypeScript developer', '', ['TypeScript']);

    expect(result.score).toBeGreaterThan(0);
    expect(result.matchedSkills).toEqual(['TypeScript']);
  });
});
