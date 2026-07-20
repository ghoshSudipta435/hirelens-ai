import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmploymentType, LocationMode, ApplicationStatus } from '@prisma/client';
import { createPrismaMock } from '../fixtures/create-prisma-mock';
import { randomUUID } from 'crypto';

const prismaFixture = createPrismaMock();

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaFixture.prismaMock,
}));

vi.mock('../../src/providers/storage/cloudinary.storage', () => ({
  cloudinaryStorage: {
    uploadFile: vi.fn().mockResolvedValue({ publicId: 'pub', secureUrl: 'http://test.url' }),
    downloadFile: vi.fn().mockResolvedValue(Buffer.from('test resume content')),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    createSignedUrl: vi.fn().mockReturnValue('http://test.url/signed'),
  },
}));

vi.mock('../../src/config/providers', () => ({
  providers: {
    getAI: vi.fn().mockResolvedValue({
      extractSkillsFromText: vi.fn().mockResolvedValue(['skill1', 'skill2']),
      generateMatchScore: vi.fn(),
      generateInterviewQuestions: vi.fn(),
    }),
    getParser: vi.fn().mockResolvedValue({
      parse: vi.fn().mockResolvedValue({ rawText: 'test', skills: [], experience: [], education: [], summary: '' }),
    }),
  },
}));

describe('applications routes', () => {
  beforeEach(() => {
    prismaFixture.state.users.length = 0;
    prismaFixture.state.resumes.length = 0;
    prismaFixture.state.jobPostings.length = 0;
    prismaFixture.state.applications.length = 0;
    prismaFixture.state.uploads.length = 0;
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

  async function registerUser(app: any, email: string, role: string) {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email,
      password: 'StrongPassword123!',
      role,
    });
    return { accessToken: res.body.data.accessToken, userId: res.body.data.user.id };
  }

  it('student creates and lists applications', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const student = await registerUser(app, 'student@test.com', 'STUDENT');
    const recruiter = await registerUser(app, 'recruiter@test.com', 'RECRUITER');

    const fileId = randomUUID();
    prismaFixture.state.uploads.push({
      id: fileId, ownerId: student.userId, fileName: 'resume.pdf',
      fileType: 'application/pdf', fileSize: 1024, cloudinaryPublicId: 'pub',
      fileUrl: 'http://test.url', createdAt: new Date(), deletedAt: null,
    });

    const resumeRes = await request(app)
      .post('/api/v1/resumes')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ uploadedFileId: fileId, title: 'My Resume' });

    const resumeId = resumeRes.body.data.id;

    await request(app)
      .patch(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ status: 'ACTIVE' });

    const jobRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiter.accessToken}`)
      .send({
        title: 'Engineer', description: 'desc',
        employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE,
        status: 'ACTIVE',
      });

    const jobId = jobRes.body.data.id;

    const applyRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ resumeId, jobPostingId: jobId });

    expect(applyRes.status).toBe(201);
    expect(applyRes.body.data.status).toBe(ApplicationStatus.SUBMITTED);

    const listRes = await request(app)
      .get('/api/v1/applications')
      .set('Authorization', `Bearer ${student.accessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.total).toBe(1);
  });

  it('recruiter can update application status', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const student = await registerUser(app, 'student2@test.com', 'STUDENT');
    const recruiter = await registerUser(app, 'recruiter2@test.com', 'RECRUITER');

    const fileId = randomUUID();
    prismaFixture.state.uploads.push({
      id: fileId, ownerId: student.userId, fileName: 'resume.pdf',
      fileType: 'application/pdf', fileSize: 1024, cloudinaryPublicId: 'pub',
      fileUrl: 'http://test.url', createdAt: new Date(), deletedAt: null,
    });

    const resumeRes = await request(app)
      .post('/api/v1/resumes')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ uploadedFileId: fileId, title: 'My Resume' });
    const resumeId = resumeRes.body.data.id;

    await request(app)
      .patch(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ status: 'ACTIVE' });

    const jobRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiter.accessToken}`)
      .send({
        title: 'Engineer', description: 'desc',
        employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE,
        status: 'ACTIVE',
      });
    const jobId = jobRes.body.data.id;

    const applyRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ resumeId, jobPostingId: jobId });
    const applicationId = applyRes.body.data.id;

    const updateRes = await request(app)
      .patch(`/api/v1/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${recruiter.accessToken}`)
      .send({ status: ApplicationStatus.SHORTLISTED });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe(ApplicationStatus.SHORTLISTED);
  });
});
