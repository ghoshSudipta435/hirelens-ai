import { Prisma, type PrismaClient, ApplicationStatus } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { logger } from '../../config/logger';
import { prisma } from '../../config/prisma';
import { providers } from '../../config/providers';
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

    const application = await this.prismaClient.application.create({
      data: {
        resumeId: data.resumeId,
        jobPostingId: data.jobPostingId,
        status: ApplicationStatus.SUBMITTED,
      },
      include: {
        resume: {
          select: { id: true, title: true, version: true, ownerId: true },
        },
        jobPosting: {
          select: { id: true, title: true, employmentType: true, locationMode: true, recruiterId: true },
        },
      },
    });

    try {
      providers.getEmail().then((email) => {
        if (!email) return;
        const studentName = 'Student';
        email.send('application-submitted', studentId, { name: studentName, jobTitle: application.jobPosting?.title ?? '' }).catch((err) => {
          logger.warn({ err, applicationId: application.id }, 'Application confirmation email failed');
        });
        Promise.all([
          prisma.user.findUnique({ where: { id: studentId }, select: { name: true } }),
          prisma.user.findUnique({ where: { id: application.jobPosting?.recruiterId ?? '' }, select: { name: true, email: true } }),
        ]).then(([student, recruiter]) => {
          if (recruiter?.email) {
            email.send('new-applicant', recruiter.email, {
              name: recruiter.name,
              jobTitle: application.jobPosting?.title ?? '',
              applicantName: student?.name ?? 'A student',
            }).catch((err) => {
              logger.warn({ err, applicationId: application.id }, 'New applicant notification email failed');
            });
          }
        });
      }).catch(() => {});
    } catch {
      // Email is best-effort
    }

    logger.info({ eventType: 'APPLICATION_CREATED', applicationId: application.id, studentId, jobPostingId: data.jobPostingId, resumeId: data.resumeId }, 'Application created');

    this.autoCreateMatch(application.id, studentId, data.resumeId, data.jobPostingId);

    return application;
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

    const updated = await this.prismaClient.application.update({
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

    logger.info({ eventType: 'APPLICATION_STATUS_UPDATED', applicationId, recruiterId, newStatus: data.status }, 'Application status updated');

    if (data.status === 'REVIEWED' || data.status === 'SHORTLISTED') {
      this.autoCreateInterviewQuestions(applicationId, updated.resumeId, updated.jobPostingId, recruiterId);
    }

    return updated;
  }

  async downloadApplicantResume(recruiterId: string, applicationId: string): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
    const application = await this.prismaClient.application.findUnique({
      where: { id: applicationId, deletedAt: null },
      include: {
        jobPosting: { select: { recruiterId: true } },
        resume: { select: { uploadedFileId: true } },
      },
    });

    if (!application) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'APPLICATION_NOT_FOUND', 'Application not found');
    }

    if (application.jobPosting.recruiterId !== recruiterId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You can only view resumes for your own job postings');
    }

    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id: application.resume.uploadedFileId, deletedAt: null },
    });

    if (!uploadedFile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'FILE_NOT_FOUND', 'No file associated with this resume');
    }

    const storage = await providers.getStorage();
    const buffer = await storage.downloadFile({ url: uploadedFile.fileUrl });

    return {
      buffer,
      contentType: uploadedFile.fileType,
      fileName: uploadedFile.fileName,
    };
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

    logger.info({ eventType: 'APPLICATION_DELETED', applicationId, userId, userRole }, 'Application soft-deleted');

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

    const restored = await this.prismaClient.application.update({
      where: { id: applicationId },
      data: { deletedAt: null },
      include: {
        resume: { select: { id: true, title: true, version: true } },
        jobPosting: { select: { id: true, title: true, employmentType: true, locationMode: true } },
      },
    });

    logger.info({ eventType: 'APPLICATION_RESTORED', applicationId, userId, userRole }, 'Application restored');

    return restored;
  }

  private autoCreateMatch(applicationId: string, studentId: string, resumeId: string, jobPostingId: string): void {
    try {
      Promise.resolve().then(async () => {
        const ai = await providers.getAI();
        const { matchCache } = await import('../../providers/cache/keys');
        const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
        const job = await prisma.jobPosting.findUnique({ where: { id: jobPostingId } });
        if (!resume || !job) return;

        const parsedData = (resume as unknown as { parsedData?: { rawText?: string; skills?: string[] } | null }).parsedData ?? null;
        const matchInput = {
          resumeSkills: parsedData?.skills ?? [],
          jobSkills: job.extractedSkills,
          resumeText: parsedData?.rawText ?? resume.title,
          jobDescription: job.description,
        };

        let score = 0;
        let matchedSkills: string[] = [];
        let missingSkills: string[] = [];
        let strengths: string[] = [];

        try {
          const output = await ai.generateMatchScore(matchInput);
          score = output.score;
          matchedSkills = output.matchedSkills;
          missingSkills = output.missingSkills;
          strengths = output.strengths;
        } catch {
          const resumeLower = matchInput.resumeText.toLowerCase();
          matchedSkills = matchInput.jobSkills.filter((s) => resumeLower.includes(s.toLowerCase()));
          missingSkills = matchInput.jobSkills.filter((s) => !resumeLower.includes(s.toLowerCase()));
          score = matchInput.jobSkills.length > 0 ? Math.round((matchedSkills.length / matchInput.jobSkills.length) * 100) : 0;
          strengths = matchedSkills.length > 0 ? [`Matched ${matchedSkills.length} skills`] : [];
        }

        await prisma.matchResult.create({
          data: {
            contextType: 'APPLICATION',
            resumeId,
            jobPostingId,
            applicationId,
            score: Math.min(score, 100),
            matchedSkills,
            missingSkills,
            strengths,
            scoreVersion: '1.0.0',
          },
        });
        
        matchCache.invalidateList(studentId).catch(() => {});
      }).catch((err) => {
        logger.warn({ err, applicationId }, 'Auto-match failed');
      });
    } catch {
      // Best-effort match
    }
  }

  private autoCreateInterviewQuestions(applicationId: string, resumeId: string, jobPostingId: string, recruiterId: string): void {
    try {
      Promise.resolve().then(async () => {
        const existingMatch = await prisma.matchResult.findFirst({
          where: { applicationId, contextType: 'APPLICATION' },
        });

        if (existingMatch) {
          const addJob = (await import('../../providers/queue')).addJob;
          const job = await addJob('interview-generate', { matchResultId: existingMatch.id, recruiterId });
          if (!job) {
            const ai = await providers.getAI();
            const match = await prisma.matchResult.findUnique({
              where: { id: existingMatch.id },
              include: { jobPosting: true },
            });
            if (!match?.jobPosting) return;

            const result = await ai.generateInterviewQuestions({
              jobTitle: match.jobPosting.title,
              jobDescription: match.jobPosting.description,
              matchedSkills: match.matchedSkills,
              missingSkills: match.missingSkills,
              strengths: match.strengths,
            });

            const questionSet = await prisma.interviewQuestionSet.create({
              data: { matchResultId: existingMatch.id },
            });

            await prisma.interviewQuestion.createMany({
              data: result.questions.map((q) => ({
                questionSetId: questionSet.id,
                question: q.question,
                difficulty: q.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
                category: q.category,
              })),
            });
          }
        }
      }).catch((err) => {
        logger.warn({ err, applicationId }, 'Auto-interview generation failed');
      });
    } catch {
      // Best-effort interview generation
    }
  }
}
