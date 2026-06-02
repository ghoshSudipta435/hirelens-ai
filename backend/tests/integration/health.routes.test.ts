import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('health routes', () => {
  it('returns health at the root path', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
  });
});
