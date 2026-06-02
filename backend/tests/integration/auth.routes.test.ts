import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaMock } from '../fixtures/create-prisma-mock';

const prismaFixture = createPrismaMock();

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaFixture.prismaMock,
}));

function getCookieHeader(response: { headers: Record<string, unknown> }) {
  const cookies = response.headers['set-cookie'];

  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error('Expected auth cookie to be set');
  }

  const cookie = cookies[0];

  if (typeof cookie !== 'string') {
    throw new Error('Expected auth cookie to be a string');
  }

  const [cookiePair] = cookie.split(';');

  if (!cookiePair) {
    throw new Error('Expected auth cookie pair to be present');
  }

  return cookiePair;
}

function getSetCookieHeader(response: { headers: Record<string, unknown> }) {
  const cookies = response.headers['set-cookie'];

  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error('Expected auth cookie to be set');
  }

  const cookie = cookies[0];

  if (typeof cookie !== 'string') {
    throw new Error('Expected auth cookie to be a string');
  }

  return cookie;
}

describe('auth routes', () => {
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

  it('registers, logs in, refreshes, and returns profile', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.accessToken).toBeTruthy();
    expect(registerResponse.body.data.user.email).toBe('ava@example.com');
    expect(getSetCookieHeader(registerResponse)).toContain('HttpOnly');
    expect(getSetCookieHeader(registerResponse)).toContain('Path=/api/v1/auth');

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'ava@example.com',
      password: 'StrongPassword123!',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.accessToken).toBeTruthy();
    const refreshCookie = getCookieHeader(loginResponse);

    const profileResponse = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.email).toBe('ava@example.com');

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.accessToken).toBeTruthy();
    expect(getSetCookieHeader(refreshResponse)).toContain('HttpOnly');
  });

  it('returns validation errors for invalid registration payloads', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'weak',
      role: 'INVALID_ROLE',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('revokes refresh tokens on logout', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', getCookieHeader(registerResponse));

    expect(logoutResponse.status).toBe(200);

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', getCookieHeader(registerResponse));

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('rate limits repeated login attempts', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app).post('/api/v1/auth/login').send({
        email: 'ava@example.com',
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
    }

    const rateLimitedResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'ava@example.com',
      password: 'WrongPassword123!',
    });

    expect(rateLimitedResponse.status).toBe(429);
    expect(rateLimitedResponse.body.error.code).toBe('RATE_LIMITED');
  });
});
