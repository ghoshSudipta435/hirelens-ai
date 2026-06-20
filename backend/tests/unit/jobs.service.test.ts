import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmploymentType, JobPostingStatus, LocationMode } from '@prisma/client';
import { createPrismaMock } from '../fixtures/create-prisma-mock';

describe('JobService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('creates a job posting successfully', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { JobService } = await import('../../src/modules/jobs/jobs.service');
    const service = new JobService({ prismaClient: prismaMock });

    const job = await service.createJob('user-1', {
      title: 'Software Engineer',
      description: 'We need a great engineer',
      employmentType: EmploymentType.FULL_TIME,
      locationMode: LocationMode.REMOTE,
      extractedSkills: ['TypeScript', 'React'],
    });

    expect(job.title).toBe('Software Engineer');
    expect(job.employmentType).toBe(EmploymentType.FULL_TIME);
    expect(job.status).toBe(JobPostingStatus.DRAFT);
    expect(state.jobPostings).toHaveLength(1);
  });

  it('lists jobs with pagination', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { JobService } = await import('../../src/modules/jobs/jobs.service');
    const service = new JobService({ prismaClient: prismaMock });

    state.jobPostings.push(
      { id: 'job-1', recruiterId: 'user-1', title: 'Engineer', description: '', extractedSkills: [], employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE, status: JobPostingStatus.ACTIVE, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      { id: 'job-2', recruiterId: 'user-1', title: 'Designer', description: '', extractedSkills: [], employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE, status: JobPostingStatus.DRAFT, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    );

    const result = await service.listJobs({ page: 1, limit: 10 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('filters jobs by status', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { JobService } = await import('../../src/modules/jobs/jobs.service');
    const service = new JobService({ prismaClient: prismaMock });

    state.jobPostings.push(
      { id: 'job-1', recruiterId: 'user-1', title: 'Engineer', description: '', extractedSkills: [], employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE, status: JobPostingStatus.ACTIVE, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      { id: 'job-2', recruiterId: 'user-1', title: 'Designer', description: '', extractedSkills: [], employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE, status: JobPostingStatus.DRAFT, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
    );

    const result = await service.listJobs({ status: JobPostingStatus.ACTIVE });
    expect(result.items).toHaveLength(1);
    expect((result.items[0] as any).title).toBe('Engineer');
  });

  it('gets a job by id', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { JobService } = await import('../../src/modules/jobs/jobs.service');
    const service = new JobService({ prismaClient: prismaMock });

    state.jobPostings.push({
      id: 'job-1', recruiterId: 'user-1', title: 'Engineer', description: 'desc', extractedSkills: [],
      employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE, status: JobPostingStatus.ACTIVE,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    const job = await service.getJob('job-1');
    expect(job.title).toBe('Engineer');
  });

  it('throws when getting a non-existent job', async () => {
    const { prismaMock } = createPrismaMock();
    const { JobService } = await import('../../src/modules/jobs/jobs.service');
    const service = new JobService({ prismaClient: prismaMock });

    await expect(service.getJob('nonexistent')).rejects.toThrow('Job posting not found');
  });

  it('updates a job posting', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { JobService } = await import('../../src/modules/jobs/jobs.service');
    const service = new JobService({ prismaClient: prismaMock });

    state.jobPostings.push({
      id: 'job-1', recruiterId: 'user-1', title: 'Engineer', description: 'desc', extractedSkills: [],
      employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE, status: JobPostingStatus.DRAFT,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    const updated = await service.updateJob('user-1', 'job-1', {
      title: 'Senior Engineer',
      status: JobPostingStatus.ACTIVE,
    });

    expect(updated.title).toBe('Senior Engineer');
    expect(updated.status).toBe(JobPostingStatus.ACTIVE);
  });

  it('prevents non-owner from updating a job', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { JobService } = await import('../../src/modules/jobs/jobs.service');
    const service = new JobService({ prismaClient: prismaMock });

    state.jobPostings.push({
      id: 'job-1', recruiterId: 'user-1', title: 'Engineer', description: 'desc', extractedSkills: [],
      employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE, status: JobPostingStatus.DRAFT,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    await expect(service.updateJob('user-2', 'job-1', { title: 'Hacked' })).rejects.toThrow('Job posting not found');
  });

  it('soft deletes a job posting', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { JobService } = await import('../../src/modules/jobs/jobs.service');
    const service = new JobService({ prismaClient: prismaMock });

    state.jobPostings.push({
      id: 'job-1', recruiterId: 'user-1', title: 'Engineer', description: 'desc', extractedSkills: [],
      employmentType: EmploymentType.FULL_TIME, locationMode: LocationMode.REMOTE, status: JobPostingStatus.DRAFT,
      createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
    });

    await service.deleteJob('user-1', 'job-1');
    const deleted = state.jobPostings.find((j: any) => j.id === 'job-1');
    expect(deleted.deletedAt).not.toBeNull();
  });
});
