import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('auth middleware', () => {
  beforeEach(() => {
    vi.resetModules();
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

  it('rejects requests without an access token', async () => {
    const { authenticateAccessToken } = await import('../../src/modules/auth/auth.middleware');
    const { errorHandler } = await import('../../src/middleware/error-handler');

    const app = express();
    app.get('/protected', authenticateAccessToken, (_request, response) => {
      response.status(200).json({ ok: true });
    });
    app.use(errorHandler);

    const response = await request(app).get('/protected');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('enforces role-based access control', async () => {
    const { authenticateAccessToken, authorizeRoles } = await import(
      '../../src/modules/auth/auth.middleware'
    );
    const { TokenService } = await import('../../src/modules/auth/token.service');
    const { errorHandler } = await import('../../src/middleware/error-handler');

    const tokenService = new TokenService();
    const accessToken = tokenService.createAccessToken({
      userId: 'user-1',
      role: 'STUDENT',
    });

    const app = express();
    app.get(
      '/recruiter-only',
      authenticateAccessToken,
      authorizeRoles('RECRUITER'),
      (_request, response) => {
        response.status(200).json({ ok: true });
      },
    );
    app.use(errorHandler);

    const response = await request(app)
      .get('/recruiter-only')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });
});
