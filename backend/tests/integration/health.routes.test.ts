import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
};

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaMock,
}));

describe('health routes', () => {
  beforeEach(() => {
    vi.resetModules();
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
  });

  it('returns health at the root path', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.database).toBe('connected');
  });

  it('returns unhealthy when database is unreachable', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    const { createApp } = await import('../../src/app');
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
  });
});
