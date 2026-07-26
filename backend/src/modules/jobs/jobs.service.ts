import { Prisma, type PrismaClient, type EmploymentType, JobPostingStatus, type LocationMode } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { logger } from '../../config/logger';
import { prisma, prismaRead } from '../../config/prisma';
import { jobCache } from '../../providers/cache/keys';
import { providers } from '../../config/providers';
import { ApiError } from '../../utils/api-error';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';
import type { CreateJobInputDto, UpdateJobInputDto } from './jobs.schemas';
import type { JobPostingListQuery, PaginatedResponse } from './jobs.types';

type JobPrismaClient = Pick<PrismaClient, 'jobPosting'>;

export class JobService {
  private readonly prismaClient: JobPrismaClient;
  private readonly prismaReadClient: JobPrismaClient;

  constructor(dependencies: { prismaClient?: JobPrismaClient; prismaReadClient?: JobPrismaClient } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
    this.prismaReadClient = dependencies.prismaReadClient ?? prismaRead;
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

    await jobCache.invalidateList().catch(() => {});

    this.extractAndUpdateSkills(job.id, data.description).catch((err) => {
      logger.warn({ err, jobId: job.id }, 'Job skill extraction failed');
    });

    return job;
  }

  async getJob(jobId: string) {
    const cached = await jobCache.get(jobId);
    if (cached) return cached;

    const job = await this.prismaReadClient.jobPosting.findUnique({
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

    await jobCache.set(jobId, job).catch(() => {});

    return job;
  }

  async listJobs(userId: string, role: string, query: JobPostingListQuery): Promise<PaginatedResponse<unknown>> {
    const { page, limit, skip } = parsePagination(query);

    const filterKey = JSON.stringify({ userId, role, status: query.status, search: query.search, employmentType: query.employmentType, locationMode: query.locationMode, page, limit });
    const cached = await jobCache.get(`list:${filterKey}`);
    if (cached) return cached as PaginatedResponse<unknown>;

    const where: Prisma.JobPostingWhereInput = {
      deletedAt: null,
    };

    if (role === 'STUDENT') {
      where.status = JobPostingStatus.ACTIVE;
    } else if (role === 'RECRUITER') {
      where.recruiterId = userId;
    }

    if (query.status && role !== 'STUDENT') {
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

    if (query.category) {
      where.category = query.category;
    }

    if (query.company) {
      where.recruiter = {
        recruiterProfile: {
          companyName: { contains: query.company, mode: 'insensitive' }
        }
      };
    }

    if (query.experienceYears !== undefined) {
      where.experienceYears = { lte: query.experienceYears };
    }

    if (query.salaryMin !== undefined || query.salaryMax !== undefined) {
      where.AND = where.AND || [];
      if (query.salaryMin !== undefined) {
        (where.AND as any[]).push({
          OR: [{ salaryMax: { gte: query.salaryMin } }, { salaryMin: { gte: query.salaryMin } }]
        });
      }
      if (query.salaryMax !== undefined) {
        (where.AND as any[]).push({
          OR: [{ salaryMin: { lte: query.salaryMax } }, { salaryMax: { lte: query.salaryMax } }]
        });
      }
    }

    if (query.skills) {
      const skillsArray = query.skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArray.length > 0) {
        where.extractedSkills = { hasSome: skillsArray };
      }
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort) {
      switch (query.sort) {
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'salary_highest':
          orderBy = { salaryMax: 'desc' };
          break;
        case 'salary_lowest':
          orderBy = { salaryMin: 'asc' };
          break;
        case 'company_name':
          orderBy = { recruiter: { recruiterProfile: { companyName: 'asc' } } };
          break;
        default:
          break;
      }
    }

    const [items, total] = await Promise.all([
      this.prismaReadClient.jobPosting.findMany({
        where,
        skip,
        take: limit,
        include: {
          recruiter: {
            select: { name: true, email: true, recruiterProfile: { select: { companyName: true } } },
          },
        },
        orderBy,
      }),
      this.prismaReadClient.jobPosting.count({ where }),
    ]);

    const result = buildPaginatedResponse(items, total, page, limit);
    await jobCache.set(`list:${filterKey}`, result).catch(() => {});

    return result;
  }

  async updateJob(recruiterId: string, jobId: string, data: UpdateJobInputDto) {
    const job = await this.prismaReadClient.jobPosting.findUnique({
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
      this.extractAndUpdateSkills(jobId, data.description).catch((err) => {
        logger.warn({ err, jobId }, 'Job skill re-extraction failed');
      });
    }

    await jobCache.invalidate(jobId).catch(() => {});

    return updated;
  }

  async deleteJob(recruiterId: string, jobId: string): Promise<{ jobId: string }> {
    const job = await this.prismaReadClient.jobPosting.findUnique({
      where: { id: jobId },
    });

    if (!job || job.recruiterId !== recruiterId || job.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'JOB_NOT_FOUND', 'Job posting not found');
    }

    await this.prismaClient.jobPosting.update({
      where: { id: jobId },
      data: { deletedAt: new Date() },
    });

    await jobCache.invalidate(jobId).catch((err) => {
      logger.error({ err, jobId }, 'Failed to invalidate job cache during deletion');
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
