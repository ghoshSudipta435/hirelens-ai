import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResumeStatus } from '@prisma/client';
import { createPrismaMock } from '../fixtures/create-prisma-mock';
import { ApiError } from '../../src/utils/api-error';

describe('ResumeService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('creates a resume successfully', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { ResumeService } = await import('../../src/modules/resumes/resumes.service');
    const service = new ResumeService({ prismaClient: prismaMock });

    state.uploads.push({
      id: 'file-1',
      ownerId: 'user-1',
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      cloudinaryPublicId: 'pub-id',
      fileUrl: 'http://example.com/test.pdf',
      createdAt: new Date(),
      deletedAt: null,
    });

    const resume = await service.createResume('user-1', {
      uploadedFileId: 'file-1',
      title: 'My Resume',
    });

    expect(resume.title).toBe('My Resume');
    expect(resume.version).toBe(1);
    expect(resume.status).toBe(ResumeStatus.DRAFT);
    expect(state.resumes).toHaveLength(1);
  });

  it('fails if uploaded file is owned by someone else', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { ResumeService } = await import('../../src/modules/resumes/resumes.service');
    const service = new ResumeService({ prismaClient: prismaMock });

    state.uploads.push({
      id: 'file-1',
      ownerId: 'user-2',
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      cloudinaryPublicId: 'pub-id',
      fileUrl: 'http://example.com/test.pdf',
      createdAt: new Date(),
      deletedAt: null,
    });

    await expect(
      service.createResume('user-1', {
        uploadedFileId: 'file-1',
        title: 'My Resume',
      })
    ).rejects.toThrow('Uploaded file not found or unauthorized');
  });

  it('prevents multiple active resumes for the same title group', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { ResumeService } = await import('../../src/modules/resumes/resumes.service');
    const service = new ResumeService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1',
      ownerId: 'user-1',
      uploadedFileId: 'file-1',
      title: 'Software Engineer',
      version: 1,
      status: ResumeStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    state.resumes.push({
      id: 'resume-2',
      ownerId: 'user-1',
      uploadedFileId: 'file-2',
      title: 'Software Engineer',
      version: 2,
      status: ResumeStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await expect(
      service.updateResume('user-1', 'resume-2', {
        status: ResumeStatus.ACTIVE,
      })
    ).rejects.toThrow('You can only have one ACTIVE resume per title group');
  });

  it('allows updating to active if no other active resume exists', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { ResumeService } = await import('../../src/modules/resumes/resumes.service');
    const service = new ResumeService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1',
      ownerId: 'user-1',
      uploadedFileId: 'file-1',
      title: 'Software Engineer',
      version: 1,
      status: ResumeStatus.ARCHIVED,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    state.resumes.push({
      id: 'resume-2',
      ownerId: 'user-1',
      uploadedFileId: 'file-2',
      title: 'Software Engineer',
      version: 2,
      status: ResumeStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const updated = await service.updateResume('user-1', 'resume-2', {
      status: ResumeStatus.ACTIVE,
    });

    expect(updated.status).toBe(ResumeStatus.ACTIVE);
  });
});
