import { Prisma, type PrismaClient, ApplicationStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/api-error';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';
import type { CreateApplicationInputDto, UpdateApplicationStatusInputDto } from './applications.schemas';
import type { ApplicationListQuery, ApplicationWithRelations } from './applications.types';

type ApplicationPrismaClient = Pick<PrismaClient, 'application' | 'resume' | 'jobPosting'>;

export class ApplicationService {
  private readonly prismaClient: ApplicationPrismaClient;

  constructor(dependencies: { prismaClient?: ApplicationPrismaClient } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
  }

  async createApplication(studentId: string, data: CreateApplicationInputDto) {
    const resume = await this.prismaClient.resume.findUnique({
      where: { id: data.resumeId },
    });

    if (!resume || resume.ownerId !== studentId || resume.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'RESUME_NOT_FOUND', 'Resume not found or unauthorized');
    }

    if (resume.status !== 'ACTIVE') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'RESUME_NOT_ACTIVE', 'Only active resumes can be used for applications');
    }

    const job = await this.prismaClient.jobPosting.findUnique({
      where: { id: data.jobPostingId },
    });

    if (!job || job.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'JOB_NOT_FOUND', 'Job posting not found');
    }

    if (job.status !== 'ACTIVE') {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'JOB_NOT_ACTIVE', 'Cannot apply to a job that is not active');
    }

    const existing = await this.prismaClient.application.findUnique({
      where: {
        resumeId_jobPostingId: {
          resumeId: data.resumeId,
          jobPostingId: data.jobPostingId,
        },
      },
    });

    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'ALREADY_APPLIED', 'You have already applied to this job with this resume');
    }

    return this.prismaClient.application.create({
      data: {
        resumeId: data.resumeId,
        jobPostingId: data.jobPostingId,
        status: ApplicationStatus.SUBMITTED,
      },
      include: {
        resume: {
          select: { id: true, title: true, version: true },
        },
        jobPosting: {
          select: { id: true, title: true, employmentType: true, locationMode: true },
        },
      },
    });
  }

  async getApplication(userId: string, userRole: string, applicationId: string) {
    const application = await this.prismaClient.application.findUnique({
      where: { id: applicationId, deletedAt: null },
      include: {
        resume: {
          select: { id: true, title: true, version: true, ownerId: true },
        },
        jobPosting: {
          select: { id: true, title: true, employmentType: true, locationMode: true, recruiterId: true },
        },
      },
    });

    if (!application) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'APPLICATION_NOT_FOUND', 'Application not found');
    }

    if (userRole === 'STUDENT' && application.resume?.ownerId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You can only view your own applications');
    }

    if (userRole === 'RECRUITER' && application.jobPosting?.recruiterId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You can only view applications to your own jobs');
    }

    return application;
  }

  async listApplications(userId: string, userRole: string, query: ApplicationListQuery) {
    const { page, limit, skip } = parsePagination(query);

    const where: Prisma.ApplicationWhereInput = { deletedAt: null };

    if (userRole === 'STUDENT') {
      where.resume = { ownerId: userId };
    } else if (userRole === 'RECRUITER') {
      where.jobPosting = { recruiterId: userId };
    }

    if (query.status) {
      where.status = query.status as ApplicationStatus;
    }

    if (query.jobPostingId) {
      where.jobPostingId = query.jobPostingId;
    }

    const [items, total] = await Promise.all([
      this.prismaClient.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          resume: {
            select: { id: true, title: true, version: true },
          },
          jobPosting: {
            select: { id: true, title: true, employmentType: true, locationMode: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaClient.application.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async updateApplicationStatus(recruiterId: string, applicationId: string, data: UpdateApplicationStatusInputDto) {
    const application = await this.prismaClient.application.findUnique({
      where: { id: applicationId, deletedAt: null },
      include: {
        jobPosting: { select: { recruiterId: true } },
      },
    });

    if (!application) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'APPLICATION_NOT_FOUND', 'Application not found');
    }

    if (application.jobPosting.recruiterId !== recruiterId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You can only update applications to your own jobs');
    }

    return this.prismaClient.application.update({
      where: { id: applicationId },
      data: { status: data.status },
      include: {
        resume: {
          select: { id: true, title: true, version: true },
        },
        jobPosting: {
          select: { id: true, title: true, employmentType: true, locationMode: true },
        },
      },
    });
  }

  async deleteApplication(userId: string, userRole: string, applicationId: string): Promise<{ applicationId: string }> {
    const application = await this.prismaClient.application.findUnique({
      where: { id: applicationId, deletedAt: null },
      include: {
        resume: { select: { ownerId: true } },
        jobPosting: { select: { recruiterId: true } },
      },
    });

    if (!application) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'APPLICATION_NOT_FOUND', 'Application not found');
    }

    if (userRole === 'STUDENT' && application.resume?.ownerId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You can only delete your own applications');
    }

    if (userRole === 'RECRUITER' && application.jobPosting?.recruiterId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You can only delete applications to your own jobs');
    }

    await this.prismaClient.application.update({
      where: { id: applicationId },
      data: { deletedAt: new Date() },
    });

    return { applicationId };
  }

  async restoreApplication(userId: string, userRole: string, applicationId: string) {
    const application = await this.prismaClient.application.findUnique({
      where: { id: applicationId },
      include: {
        resume: { select: { ownerId: true } },
        jobPosting: { select: { recruiterId: true } },
      },
    });

    if (!application || !application.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'APPLICATION_NOT_FOUND', 'Application not found');
    }

    if (userRole === 'STUDENT' && application.resume?.ownerId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You can only restore your own applications');
    }

    if (userRole === 'RECRUITER' && application.jobPosting?.recruiterId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You can only restore applications to your own jobs');
    }

    return this.prismaClient.application.update({
      where: { id: applicationId },
      data: { deletedAt: null },
      include: {
        resume: { select: { id: true, title: true, version: true } },
        jobPosting: { select: { id: true, title: true, employmentType: true, locationMode: true } },
      },
    });
  }
}
