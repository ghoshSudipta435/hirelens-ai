import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaMock } from '../fixtures/create-prisma-mock';

const prismaFixture = createPrismaMock();
const cloudinaryStorageMock = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  createSignedUrl: vi.fn(),
}));

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaFixture.prismaMock,
}));

vi.mock('../../src/providers/storage/cloudinary.storage', () => ({
  cloudinaryStorage: cloudinaryStorageMock,
}));

describe('uploads routes', () => {
  beforeEach(() => {
    vi.resetModules();
    prismaFixture.state.users.length = 0;
    prismaFixture.state.studentProfiles.length = 0;
    prismaFixture.state.recruiterProfiles.length = 0;
    prismaFixture.state.refreshTokens.length = 0;
    prismaFixture.state.uploads.length = 0;
    prismaFixture.state.authAuditEvents.length = 0;
    prismaFixture.state.uploadAuditEvents.length = 0;
    cloudinaryStorageMock.uploadFile.mockReset();
    cloudinaryStorageMock.deleteFile.mockReset();
    cloudinaryStorageMock.createSignedUrl.mockReset();
    cloudinaryStorageMock.uploadFile.mockResolvedValue({
      publicId: 'hirelens-ai/uploads/resume',
      secureUrl: 'https://res.cloudinary.com/demo/resume',
    });
    cloudinaryStorageMock.deleteFile.mockResolvedValue(undefined);
    cloudinaryStorageMock.createSignedUrl.mockReturnValue('https://signed.example/upload');
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

  it('uploads, fetches, and deletes an owned file', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    const accessToken = registerResponse.body.data.accessToken;

    const uploadResponse = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('%PDF-1.4 resume'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      });

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body.data.fileName).toBe('resume.pdf');
    expect(uploadResponse.body.data.fileUrl).toBe('https://signed.example/upload');
    expect(prismaFixture.state.uploadAuditEvents.at(-1)?.eventType).toBe('UPLOAD_CREATE');

    const uploadId = uploadResponse.body.data.id as string;

    const getResponse = await request(app)
      .get(`/api/v1/uploads/${uploadId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.id).toBe(uploadId);

    const deleteResponse = await request(app)
      .delete(`/api/v1/uploads/${uploadId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
    expect(cloudinaryStorageMock.deleteFile).toHaveBeenCalledTimes(1);

    const afterDeleteResponse = await request(app)
      .get(`/api/v1/uploads/${uploadId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(afterDeleteResponse.status).toBe(404);
    expect(afterDeleteResponse.body.error.code).toBe('UPLOAD_NOT_FOUND');
  });

  it('lists owned files', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    const accessToken = registerResponse.body.data.accessToken;

    await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('%PDF-1.4 resume'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      });

    const listResponse = await request(app)
      .get('/api/v1/uploads')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.items).toHaveLength(1);
    expect(listResponse.body.data.items[0].fileName).toBe('resume.pdf');
  });

  it('rejects unsupported mime types before upload', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    const response = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${registerResponse.body.data.accessToken}`)
      .attach('file', Buffer.from('plain text'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(415);
    expect(response.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('blocks access to another user upload', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const ownerRegistration = await request(app).post('/api/v1/auth/register').send({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    const intruderRegistration = await request(app).post('/api/v1/auth/register').send({
      name: 'Rahul Mehta',
      email: 'rahul@example.com',
      password: 'StrongPassword123!',
      role: 'RECRUITER',
    });

    const uploadResponse = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${ownerRegistration.body.data.accessToken}`)
      .attach('file', Buffer.from('%PDF-1.4 resume'), {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      });

    const uploadId = uploadResponse.body.data.id as string;

    const response = await request(app)
      .get(`/api/v1/uploads/${uploadId}`)
      .set('Authorization', `Bearer ${intruderRegistration.body.data.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('UPLOAD_NOT_FOUND');
  });
});
