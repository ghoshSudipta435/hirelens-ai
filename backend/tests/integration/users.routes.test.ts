import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaMock } from '../fixtures/create-prisma-mock';

const prismaFixture = createPrismaMock();

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaFixture.prismaMock,
}));

describe('users routes', () => {
  beforeEach(() => {
    prismaFixture.state.users.length = 0;
    prismaFixture.state.jobPostings.length = 0;
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

  it('recruiter can list all users', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    await registerUser(app, 'STUDENT');
    await registerUser(app, 'STUDENT');
    const { accessToken } = await registerUser(app, 'RECRUITER');

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
  });

  it('student cannot list users', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();
    const { accessToken } = await registerUser(app, 'STUDENT');

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(403);
  });

  it('any authenticated user can get a user by id', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const { accessToken } = await registerUser(app, 'STUDENT');

    const res = await request(app)
      .get('/api/v1/users/some-id')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });
});
