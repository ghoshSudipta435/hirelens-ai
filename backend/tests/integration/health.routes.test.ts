import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
};

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaMock,
}));

const ORIGINAL_REDIS_URL = process.env.REDIS_URL;

describe('health routes', () => {
  beforeEach(() => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    delete process.env.REDIS_URL;
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

  afterAll(() => {
    if (ORIGINAL_REDIS_URL === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = ORIGINAL_REDIS_URL;
    }
  });

  it('returns health at the root path', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.database).toBe('connected');
  });

  it('returns unhealthy when database is unreachable', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    const { createApp } = await import('../../src/app');
    const app = createApp();

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
  });

  it('returns workers disabled when redis is not configured', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const response = await request(app).get('/api/v1/workers/health');

    expect(response.status).toBe(200);
    expect(response.body.data.workers).toBe('disabled');
    expect(response.body.data.redis).toBe('not_configured');
  });

  it('returns workers running when redis is configured', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    const { createApp } = await import('../../src/app');
    const app = createApp();

    const response = await request(app).get('/api/v1/workers/health');

    expect(response.status).toBe(200);
    expect(response.body.data.workers).toBe('running');
    expect(response.body.data.redis).toBe('configured');
    expect(response.body.data.queues).toHaveLength(3);
    expect(response.body.data.queues).toContain('resume-parse');
    expect(response.body.data.queues).toContain('match-score');
    expect(response.body.data.queues).toContain('interview-generate');
  });
});
