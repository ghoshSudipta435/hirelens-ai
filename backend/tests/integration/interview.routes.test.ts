import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaMock } from '../fixtures/create-prisma-mock';

const prismaFixture = createPrismaMock();

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaFixture.prismaMock,
}));

vi.mock('../../src/providers/ai', () => ({
  getAIProvider: () => ({
    extractSkillsFromText: vi.fn().mockResolvedValue(['TypeScript', 'React']),
    generateMatchScore: vi.fn().mockResolvedValue({
      score: 85,
      matchedSkills: ['TypeScript'],
      missingSkills: ['Python'],
      strengths: ['Strong frontend skills'],
    }),
    generateInterviewQuestions: vi.fn().mockResolvedValue({
      questions: [
        { question: 'What is React?', difficulty: 'EASY', category: 'Frontend' },
      ],
    }),
  }),
}));

describe('interview routes', () => {
  beforeEach(() => {
    prismaFixture.state.users.length = 0;
    prismaFixture.state.resumes.length = 0;
    prismaFixture.state.jobPostings.length = 0;
    prismaFixture.state.matchResults.length = 0;
    prismaFixture.state.interviewQuestionSets.length = 0;
    prismaFixture.state.interviewQuestions.length = 0;
    process.env.NODE_ENV = 'test';
    process.env.CLIENT_ORIGIN = 'http://localhost:3000';
    process.env.DATABASE_URL =
      'postgresql://user:pass@ep-test-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';
    process.env.DIRECT_URL =
      'postgresql://user:pass@ep-test.us-east-2.aws.neon.tech/neondb?sslmode=require';
    process.env.JWT_SECRET = 'test-access-secret-with-at-least-32-characters';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-chars';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.BCRYPT_SALT_ROUNDS = '10';
    process.env.LOG_LEVEL = 'silent';
  });

  async function registerUser(app: any, role: string) {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: `test-${Date.now()}-${Math.random()}@example.com`,
      password: 'StrongPassword123!',
      role,
    });
    return {
      accessToken: res.body.data.accessToken,
      userId: res.body.data.user.id,
    };
  }

  it('recruiter can generate interview questions', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const student = await registerUser(app, 'STUDENT');
    const recruiter = await registerUser(app, 'RECRUITER');

    prismaFixture.state.resumes.push({
      id: 'resume-1',
      ownerId: student.userId,
      uploadedFileId: 'file-1',
      title: 'My Resume',
      version: 1,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    prismaFixture.state.jobPostings.push({
      id: 'job-1',
      recruiterId: recruiter.userId,
      title: 'Engineer',
      description: 'Test job',
      extractedSkills: ['TypeScript'],
      employmentType: 'FULL_TIME',
      locationMode: 'REMOTE',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    prismaFixture.state.matchResults.push({
      id: 'match-1',
      contextType: 'PREVIEW',
      resumeId: 'resume-1',
      jobPostingId: 'job-1',
      score: 85,
      matchedSkills: ['TypeScript'],
      missingSkills: ['Python'],
      strengths: [],
      scoreVersion: '1.0.0',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/interviews/generate')
      .set('Authorization', `Bearer ${recruiter.accessToken}`)
      .send({ matchResultId: 'match-1' });

    expect(res.status).toBe(201);
    expect(res.body.data.questions).toHaveLength(1);
    expect(res.body.data.questions[0].question).toBe('What is React?');
  });

  it('student cannot generate interview questions', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();
    const { accessToken } = await registerUser(app, 'STUDENT');

    const res = await request(app)
      .post('/api/v1/interviews/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ matchResultId: 'match-1' });

    expect(res.status).toBe(403);
  });

  it('returns question set by id', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();
    const student = await registerUser(app, 'STUDENT');
    const recruiter = await registerUser(app, 'RECRUITER');

    prismaFixture.state.resumes.push({
      id: 'resume-1',
      ownerId: student.userId,
      uploadedFileId: 'file-1',
      title: 'My Resume',
      version: 1,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    prismaFixture.state.jobPostings.push({
      id: 'job-1',
      recruiterId: recruiter.userId,
      title: 'Engineer',
      description: 'Test job',
      extractedSkills: ['TypeScript'],
      employmentType: 'FULL_TIME',
      locationMode: 'REMOTE',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    prismaFixture.state.matchResults.push({
      id: 'match-1',
      contextType: 'PREVIEW',
      resumeId: 'resume-1',
      jobPostingId: 'job-1',
      score: 85,
      matchedSkills: ['TypeScript'],
      missingSkills: [],
      strengths: [],
      scoreVersion: '1.0.0',
      createdAt: new Date(),
    });

    prismaFixture.state.interviewQuestionSets.push({
      id: 'qs-1',
      matchResultId: 'match-1',
      createdAt: new Date(),
    });

    prismaFixture.state.interviewQuestions.push({
      id: 'q-1',
      questionSetId: 'qs-1',
      question: 'What is React?',
      difficulty: 'EASY',
      category: 'Frontend',
      createdAt: new Date(),
    });

    const res = await request(app)
      .get('/api/v1/interviews/qs-1')
      .set('Authorization', `Bearer ${student.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(1);
  });
});
