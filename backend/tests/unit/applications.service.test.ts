import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationStatus } from '@prisma/client';
import { createPrismaMock } from '../fixtures/create-prisma-mock';

describe('ApplicationService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('creates an application successfully', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { ApplicationService } = await import('../../src/modules/applications/applications.service');
    const service = new ApplicationService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1', ownerId: 'student-1', uploadedFileId: 'file-1', title: 'My Resume',
      version: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.jobPostings.push({
      id: 'job-1', recruiterId: 'recruiter-1', title: 'Engineer', description: '', extractedSkills: [],
      employmentType: 'FULL_TIME', locationMode: 'REMOTE', status: 'ACTIVE',
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    const app = await service.createApplication('student-1', {
      resumeId: 'resume-1',
      jobPostingId: 'job-1',
    });

    expect(app.status).toBe(ApplicationStatus.SUBMITTED);
    expect(state.applications).toHaveLength(1);
  });

  it('rejects application with non-active resume', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { ApplicationService } = await import('../../src/modules/applications/applications.service');
    const service = new ApplicationService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1', ownerId: 'student-1', uploadedFileId: 'file-1', title: 'My Resume',
      version: 1, status: 'DRAFT', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    await expect(
      service.createApplication('student-1', { resumeId: 'resume-1', jobPostingId: 'job-1' })
    ).rejects.toThrow('Only active resumes can be used for applications');
  });

  it('rejects duplicate applications', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { ApplicationService } = await import('../../src/modules/applications/applications.service');
    const service = new ApplicationService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1', ownerId: 'student-1', uploadedFileId: 'file-1', title: 'My Resume',
      version: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.jobPostings.push({
      id: 'job-1', recruiterId: 'recruiter-1', title: 'Engineer', description: '', extractedSkills: [],
      employmentType: 'FULL_TIME', locationMode: 'REMOTE', status: 'ACTIVE',
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    await service.createApplication('student-1', { resumeId: 'resume-1', jobPostingId: 'job-1' });
    await expect(
      service.createApplication('student-1', { resumeId: 'resume-1', jobPostingId: 'job-1' })
    ).rejects.toThrow('You have already applied');
  });

  it('lists applications for a student', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { ApplicationService } = await import('../../src/modules/applications/applications.service');
    const service = new ApplicationService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1', ownerId: 'student-1', uploadedFileId: 'file-1', title: 'My Resume',
      version: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.applications.push({
      id: 'app-1', resumeId: 'resume-1', jobPostingId: 'job-1', status: ApplicationStatus.SUBMITTED,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const result = await service.listApplications('student-1', 'STUDENT', { page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
  });

  it('updates application status as recruiter', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { ApplicationService } = await import('../../src/modules/applications/applications.service');
    const service = new ApplicationService({ prismaClient: prismaMock });

    state.resumes.push({
      id: 'resume-1', ownerId: 'student-1', uploadedFileId: 'file-1', title: 'My Resume',
      version: 1, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.jobPostings.push({
      id: 'job-1', recruiterId: 'recruiter-1', title: 'Engineer', description: '', extractedSkills: [],
      employmentType: 'FULL_TIME', locationMode: 'REMOTE', status: 'ACTIVE',
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });
    state.applications.push({
      id: 'app-1', resumeId: 'resume-1', jobPostingId: 'job-1', status: ApplicationStatus.SUBMITTED,
      createdAt: new Date(), updatedAt: new Date(),
    });

    const updated = await service.updateApplicationStatus('recruiter-1', 'app-1', {
      status: ApplicationStatus.SHORTLISTED,
    });

    expect(updated.status).toBe(ApplicationStatus.SHORTLISTED);
  });
});
