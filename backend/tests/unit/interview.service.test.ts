import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrismaMock } from '../fixtures/create-prisma-mock';

vi.mock('../../src/providers/ai', () => ({
  getAIProvider: () => ({
    generateInterviewQuestions: vi.fn().mockResolvedValue({
      questions: [
        { question: 'What is React?', difficulty: 'EASY', category: 'Frontend' },
        { question: 'Explain closures', difficulty: 'MEDIUM', category: 'JavaScript' },
        { question: 'Design a scalable system', difficulty: 'HARD', category: 'System Design' },
      ],
    }),
  }),
}));

describe('InterviewService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('generates interview questions successfully', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { InterviewService } = await import('../../src/modules/interview/interview.service');
    const service = new InterviewService({ prismaClient: prismaMock });

    state.matchResults.push({
      id: 'match-1', contextType: 'PREVIEW', resumeId: 'resume-1', jobPostingId: 'job-1',
      score: 85, matchedSkills: ['TypeScript', 'React'], missingSkills: ['Python'],
      strengths: ['Strong frontend'], scoreVersion: '1.0.0', createdAt: new Date(),
    });
    state.jobPostings.push({
      id: 'job-1', recruiterId: 'recruiter-1', title: 'Engineer', description: 'We need React',
      extractedSkills: ['TypeScript', 'React'], employmentType: 'FULL_TIME', locationMode: 'REMOTE',
      status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    const qs = await service.generateQuestions('recruiter-1', 'match-1');

    expect((qs as any).questions).toHaveLength(3);
    expect(state.interviewQuestionSets).toHaveLength(1);
  });

  it('returns existing question set if already generated', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { InterviewService } = await import('../../src/modules/interview/interview.service');
    const service = new InterviewService({ prismaClient: prismaMock });

    state.matchResults.push({
      id: 'match-1', contextType: 'PREVIEW', resumeId: 'resume-1', jobPostingId: 'job-1',
      score: 85, matchedSkills: [], missingSkills: [], strengths: [], scoreVersion: '1.0.0',
      createdAt: new Date(),
    });
    state.jobPostings.push({
      id: 'job-1', recruiterId: 'recruiter-1', title: 'Engineer', description: '',
      extractedSkills: [], employmentType: 'FULL_TIME', locationMode: 'REMOTE',
      status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.interviewQuestionSets.push({
      id: 'qs-1', matchResultId: 'match-1', createdAt: new Date(),
    });
    state.interviewQuestions.push({
      id: 'q-1', questionSetId: 'qs-1', question: 'Existing?', difficulty: 'EASY', category: 'General',
    });

    const qs = await service.generateQuestions('recruiter-1', 'match-1');
    expect((qs as any).questions).toHaveLength(1);
    expect((qs as any).questions[0]!.question).toBe('Existing?');
  });

  it('throws if match result not found', async () => {
    const { prismaMock } = createPrismaMock();
    const { InterviewService } = await import('../../src/modules/interview/interview.service');
    const service = new InterviewService({ prismaClient: prismaMock });

    await expect(service.generateQuestions('recruiter-1', 'nonexistent')).rejects.toThrow('Match result not found');
  });
});
