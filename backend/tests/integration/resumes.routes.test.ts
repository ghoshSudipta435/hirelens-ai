import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrismaMock } from '../fixtures/create-prisma-mock';
import { randomUUID } from 'crypto';
import { ResumeStatus } from '@prisma/client';

const prismaFixture = createPrismaMock();

vi.mock('../../src/config/prisma', () => ({
  prisma: prismaFixture.prismaMock,
}));

vi.mock('../../src/providers/storage/cloudinary.storage', () => ({
  cloudinaryStorage: {
    uploadFile: vi.fn().mockResolvedValue({ publicId: 'pub', secureUrl: 'http://test.url' }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    createSignedUrl: vi.fn().mockReturnValue('http://test.url/signed'),
  },
}));

describe('resumes routes', () => {
  beforeEach(() => {
    vi.resetModules();
    prismaFixture.state.users.length = 0;
    prismaFixture.state.uploads.length = 0;
    prismaFixture.state.resumes.length = 0;
    process.env.NODE_ENV = 'test';
    process.env.CLIENT_ORIGIN = 'http://localhost:3000';
    process.env.JWT_SECRET = 'test-access-secret-with-at-least-32-characters';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.LOG_LEVEL = 'silent';
  });

  it('creates, fetches, updates, and deletes a resume', async () => {
    const { createApp } = await import('../../src/app');
    const app = createApp();

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    const accessToken = registerResponse.body.data.accessToken;
    const userId = registerResponse.body.data.user.id;

    const fileId = randomUUID();
    prismaFixture.state.uploads.push({
      id: fileId,
      ownerId: userId,
      fileName: 'resume.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      cloudinaryPublicId: 'pub',
      fileUrl: 'http://test.url',
      createdAt: new Date(),
      deletedAt: null,
    });

    const createRes = await request(app)
      .post('/api/v1/resumes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        uploadedFileId: fileId,
        title: 'Software Engineer',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('Software Engineer');
    expect(createRes.body.data.version).toBe(1);

    const resumeId = createRes.body.data.id;

    const getRes = await request(app)
      .get(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(resumeId);

    const updateRes = await request(app)
      .patch(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        status: ResumeStatus.ACTIVE,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe(ResumeStatus.ACTIVE);

    const listRes = await request(app)
      .get('/api/v1/resumes')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items).toHaveLength(1);

    const deleteRes = await request(app)
      .delete(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(deleteRes.status).toBe(200);

    const getAfterDeleteRes = await request(app)
      .get(`/api/v1/resumes/${resumeId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(getAfterDeleteRes.status).toBe(404);
  });
});
