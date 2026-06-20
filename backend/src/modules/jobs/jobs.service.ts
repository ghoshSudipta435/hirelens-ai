import { Prisma, type PrismaClient, type EmploymentType, JobPostingStatus, type LocationMode } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/api-error';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';
import type { CreateJobInputDto, UpdateJobInputDto } from './jobs.schemas';
import type { JobPostingListQuery, PaginatedResponse } from './jobs.types';

type JobPrismaClient = Pick<PrismaClient, 'jobPosting' | '$transaction'>;

export class JobService {
  private readonly prismaClient: JobPrismaClient;

  constructor(dependencies: { prismaClient?: JobPrismaClient } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
  }

  async createJob(recruiterId: string, data: CreateJobInputDto) {
    return this.prismaClient.jobPosting.create({
      data: {
        recruiterId,
        title: data.title,
        description: data.description,
        extractedSkills: data.extractedSkills,
        employmentType: data.employmentType,
        locationMode: data.locationMode,
        status: data.status ?? JobPostingStatus.DRAFT,
      },
    });
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
    return this.prismaClient.$transaction(async (tx) => {
      const job = await tx.jobPosting.findUnique({
        where: { id: jobId },
      });

      if (!job || job.recruiterId !== recruiterId || job.deletedAt) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'JOB_NOT_FOUND', 'Job posting not found');
      }

      return tx.jobPosting.update({
        where: { id: jobId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.extractedSkills !== undefined && { extractedSkills: data.extractedSkills }),
          ...(data.employmentType !== undefined && { employmentType: data.employmentType }),
          ...(data.locationMode !== undefined && { locationMode: data.locationMode }),
          ...(data.status !== undefined && { status: data.status }),
        },
      });
    });
  }

  async deleteJob(recruiterId: string, jobId: string): Promise<{ jobId: string }> {
    return this.prismaClient.$transaction(async (tx) => {
      const job = await tx.jobPosting.findUnique({
        where: { id: jobId },
      });

      if (!job || job.recruiterId !== recruiterId || job.deletedAt) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'JOB_NOT_FOUND', 'Job posting not found');
      }

      await tx.jobPosting.update({
        where: { id: jobId },
        data: {
          deletedAt: new Date(),
        },
      });

      return { jobId };
    });
  }
}
