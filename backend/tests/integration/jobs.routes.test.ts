import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmploymentType, JobPostingStatus, LocationMode } from '@prisma/client';
import { createPrismaMock } from '../fixtures/create-prisma-mock';

const prismaFixture = createPrismaMock();

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaFixture.prismaMock,
}));

describe('jobs routes', () => {
  beforeEach(() => {
    vi.resetModules();
    prismaFixture.state.users.length = 0;
    prismaFixture.state.jobPostings.length = 0;
    process.env.NODE_ENV = 'test';
    process.env.CLIENT_ORIGIN = 'http://localhost:3000';
    process.env.JWT_SECRET = 'test-access-secret-with-at-least-32-characters';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.LOG_LEVEL = 'silent';
  });

  async function registerUser(app: any, role: string) {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role,
    });
    return { accessToken: res.body.data.accessToken, userId: res.body.data.user.id };
  }

  it('recruiter creates, lists, gets, updates, and deletes a job', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();
    const { accessToken } = await registerUser(app, 'RECRUITER');

    const createRes = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Senior Engineer',
        description: 'We need a senior engineer',
        employmentType: EmploymentType.FULL_TIME,
        locationMode: LocationMode.REMOTE,
        status: JobPostingStatus.ACTIVE,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('Senior Engineer');

    const jobId = createRes.body.data.id;

    const getRes = await request(app)
      .get(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(jobId);

    const listRes = await request(app)
      .get('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.total).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Lead Engineer' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Lead Engineer');

    const deleteRes = await request(app)
      .delete(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteRes.status).toBe(200);

    const getAfterDeleteRes = await request(app)
      .get(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getAfterDeleteRes.status).toBe(404);
  });

  it('prevents student from creating a job', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();
    const { accessToken } = await registerUser(app, 'STUDENT');

    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Engineer',
        description: 'desc',
        employmentType: EmploymentType.FULL_TIME,
        locationMode: LocationMode.REMOTE,
      });

    expect(res.status).toBe(403);
  });
});
