import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaMock } from '../fixtures/create-prisma-mock';

describe('UploadService', () => {
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

  it('creates uploads with validated file metadata', async () => {
    const { prismaMock, state } = createPrismaMock();
    const storage = {
      uploadFile: vi.fn().mockResolvedValue({
        publicId: 'hirelens-ai/uploads/resume',
        secureUrl: 'https://res.cloudinary.com/demo/resume',
      }),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      createSignedUrl: vi.fn().mockReturnValue('https://signed.example/upload'),
    };

    const { UploadService } = await import('../../src/modules/uploads/uploads.service');
    const service = new UploadService({
      prismaClient: prismaMock,
      storage,
    });

    const file = {
      buffer: Buffer.from('%PDF-1.4 resume'),
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    const result = await service.createUpload('user-id', file);

    expect(storage.uploadFile).toHaveBeenCalledTimes(1);
    expect(storage.createSignedUrl).toHaveBeenCalledTimes(1);
    expect(result.upload.originalName).toBe('resume.pdf');
    expect(state.uploads).toHaveLength(1);
  });

  it('rejects unsupported file types', async () => {
    const { prismaMock } = createPrismaMock();
    const storage = {
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      createSignedUrl: vi.fn(),
    };

    const { UploadService } = await import('../../src/modules/uploads/uploads.service');
    const service = new UploadService({
      prismaClient: prismaMock,
      storage,
    });

    const file = {
      buffer: Buffer.from('plain text'),
      originalname: 'notes.txt',
      mimetype: 'text/plain',
      size: 1024,
    } as Express.Multer.File;

    await expect(service.createUpload('user-id', file)).rejects.toMatchObject({
      code: 'UNSUPPORTED_FILE_TYPE',
    });
  });

  it('cleans up cloudinary assets if persistence fails', async () => {
    const { prismaMock } = createPrismaMock();
    const storage = {
      uploadFile: vi.fn().mockResolvedValue({
        publicId: 'hirelens-ai/uploads/resume',
        secureUrl: 'https://res.cloudinary.com/demo/resume',
      }),
      deleteFile: vi.fn().mockResolvedValue(undefined),
      createSignedUrl: vi.fn().mockReturnValue('https://signed.example/upload'),
    };

    prismaMock.upload.create = vi.fn().mockRejectedValue(new Error('db failure'));

    const { UploadService } = await import('../../src/modules/uploads/uploads.service');
    const service = new UploadService({
      prismaClient: prismaMock,
      storage,
    });

    const file = {
      buffer: Buffer.from('%PDF-1.4 resume'),
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    } as Express.Multer.File;

    await expect(service.createUpload('user-id', file)).rejects.toThrow('db failure');
    expect(storage.deleteFile).toHaveBeenCalledTimes(1);
  });
});
