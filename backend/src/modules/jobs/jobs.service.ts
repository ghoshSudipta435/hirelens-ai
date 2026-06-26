import { Prisma, type PrismaClient, type EmploymentType, JobPostingStatus, type LocationMode } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { providers } from '../../config/providers';
import { ApiError } from '../../utils/api-error';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';
import type { CreateJobInputDto, UpdateJobInputDto } from './jobs.schemas';
import type { JobPostingListQuery, PaginatedResponse } from './jobs.types';

type JobPrismaClient = Pick<PrismaClient, 'jobPosting'>;

export class JobService {
  private readonly prismaClient: JobPrismaClient;

  constructor(dependencies: { prismaClient?: JobPrismaClient } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
  }

  async createJob(recruiterId: string, data: CreateJobInputDto) {
    const job = await this.prismaClient.jobPosting.create({
      data: {
        recruiterId,
        title: data.title,
        description: data.description,
        extractedSkills: [],
        employmentType: data.employmentType,
        locationMode: data.locationMode,
        status: data.status ?? JobPostingStatus.DRAFT,
      },
    });

    this.extractAndUpdateSkills(job.id, data.description).catch(() => {});

    return job;
  }

  async getJob(jobId: string) {
    const job = await this.prismaClient.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        recruiter: {
          select: { name: true, email: true },
        },
      },
    });

    if (!job || job.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'JOB_NOT_FOUND', 'Job posting not found');
    }

    return job;
  }

  async listJobs(query: JobPostingListQuery): Promise<PaginatedResponse<unknown>> {
    const { page, limit, skip } = parsePagination(query);

    const where: Prisma.JobPostingWhereInput = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status as JobPostingStatus;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.employmentType) {
      where.employmentType = query.employmentType as EmploymentType;
    }

    if (query.locationMode) {
      where.locationMode = query.locationMode as LocationMode;
    }

    const [items, total] = await Promise.all([
      this.prismaClient.jobPosting.findMany({
        where,
        skip,
        take: limit,
        include: {
          recruiter: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaClient.jobPosting.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async updateJob(recruiterId: string, jobId: string, data: UpdateJobInputDto) {
    const job = await this.prismaClient.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job || job.recruiterId !== recruiterId || job.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'JOB_NOT_FOUND', 'Job posting not found');
    }

    const updateData: Prisma.JobPostingUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.locationMode !== undefined) updateData.locationMode = data.locationMode;
    if (data.status !== undefined) updateData.status = data.status;

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const updated = await this.prismaClient.jobPosting.update({
      where: { id: jobId },
      data: updateData,
    });

    if (data.description !== undefined) {
      this.extractAndUpdateSkills(jobId, data.description).catch(() => {});
    }

    return updated;
  }

  async deleteJob(recruiterId: string, jobId: string): Promise<{ jobId: string }> {
    const job = await this.prismaClient.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job || job.recruiterId !== recruiterId || job.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'JOB_NOT_FOUND', 'Job posting not found');
    }

    await this.prismaClient.jobPosting.update({
      where: { id: jobId },
      data: { deletedAt: new Date() },
    });

    return { jobId };
  }

  private async extractAndUpdateSkills(jobId: string, description: string): Promise<void> {
    try {
      const ai = await providers.getAI();
      const skills = await ai.extractSkillsFromText(description);
      await this.prismaClient.jobPosting.update({
        where: { id: jobId },
        data: { extractedSkills: skills },
      });
    } catch {
      // Best-effort skill extraction; job is already created
    }
  }
}
