import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaMock } from '../fixtures/create-prisma-mock';

const prismaFixture = createPrismaMock();

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaFixture.prismaMock,
}));

describe('profile routes', () => {
  beforeEach(() => {
    vi.resetModules();
    prismaFixture.state.users.length = 0;
    prismaFixture.state.studentProfiles.length = 0;
    prismaFixture.state.recruiterProfiles.length = 0;
    prismaFixture.state.refreshTokens.length = 0;
    prismaFixture.state.uploads.length = 0;
    prismaFixture.state.authAuditEvents.length = 0;
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

  it('returns and updates the current student profile', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    const accessToken = registerResponse.body.data.accessToken;

    const currentProfileResponse = await request(app)
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(currentProfileResponse.status).toBe(200);
    expect(currentProfileResponse.body.data.user.email).toBe('ava@example.com');
    expect(currentProfileResponse.body.data.profile.fullName).toBe('Ava Sharma');

    const patchResponse = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        headline: 'Computer Science Student',
        university: 'Delhi University',
        graduationYear: 2027,
        githubUrl: 'https://github.com/ava',
      });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.data.profile.headline).toBe('Computer Science Student');
    expect(patchResponse.body.data.profile.githubUrl).toBe('https://github.com/ava');

    const profileByUserIdResponse = await request(app)
      .get(`/api/v1/profile/${registerResponse.body.data.user.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(profileByUserIdResponse.status).toBe(200);
    expect(profileByUserIdResponse.body.data.profile.headline).toBe(
      'Computer Science Student',
    );
  });

  it('enforces role-specific profile fields for recruiters and students', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const studentRegistration = await request(app).post('/api/v1/auth/register').send({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    const recruiterRegistration = await request(app).post('/api/v1/auth/register').send({
      name: 'Rahul Mehta',
      email: 'rahul@example.com',
      password: 'StrongPassword123!',
      role: 'RECRUITER',
    });

    const studentPatch = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${studentRegistration.body.data.accessToken}`)
      .send({
        companyName: 'Acme Corp',
      });

    expect(studentPatch.status).toBe(400);
    expect(studentPatch.body.error.code).toBe('VALIDATION_ERROR');

    const recruiterPatch = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${recruiterRegistration.body.data.accessToken}`)
      .send({
        fullName: 'Not Allowed',
      });

    expect(recruiterPatch.status).toBe(400);
    expect(recruiterPatch.body.error.code).toBe('VALIDATION_ERROR');

    const recruiterUpdate = await request(app)
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${recruiterRegistration.body.data.accessToken}`)
      .send({
        companyName: 'Acme Corp',
        companyWebsite: 'https://acme.example',
        designation: 'Talent Partner',
      });

    expect(recruiterUpdate.status).toBe(200);
    expect(recruiterUpdate.body.data.profile.companyName).toBe('Acme Corp');
  });

  it('requires authentication for profile access', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const response = await request(app).get('/api/v1/profile');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
