import { Prisma, type PrismaClient, ResumeStatus, type ResumeAuditEventType, type UploadedFile } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { providers } from '../../config/providers';
import type { CloudinaryStorage } from '../../providers/storage/cloudinary.storage';
import { cloudinaryStorage } from '../../providers/storage/cloudinary.storage';
import { ApiError } from '../../utils/api-error';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';
import type { CreateResumeInputDto, UpdateResumeInputDto } from './resumes.schemas';
import type { ResumeAuditInput, ResumeListQuery, ResumeWithFile } from './resumes.types';

type ResumePrismaClient = Pick<PrismaClient, 'resume' | 'uploadedFile' | 'resumeAuditEvent'>;

export class ResumeService {
  private readonly prismaClient: ResumePrismaClient;
  private readonly storage: CloudinaryStorage;

  constructor(dependencies: { prismaClient?: ResumePrismaClient; storage?: CloudinaryStorage } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
    this.storage = dependencies.storage ?? cloudinaryStorage;
  }

  async createResume(userId: string, data: CreateResumeInputDto): Promise<ResumeWithFile> {
    const file = await this.prismaClient.uploadedFile.findUnique({
      where: { id: data.uploadedFileId },
    });

    if (!file || file.ownerId !== userId || file.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'FILE_NOT_FOUND', 'Uploaded file not found or unauthorized');
    }

    const existingResumeWithFile = await this.prismaClient.resume.findUnique({
      where: { uploadedFileId: data.uploadedFileId },
    });

    if (existingResumeWithFile && !existingResumeWithFile.deletedAt) {
       throw new ApiError(StatusCodes.BAD_REQUEST, 'FILE_ALREADY_LINKED', 'This file is already associated with a resume');
    }

    const lastVersionResume = await this.prismaClient.resume.findFirst({
      where: { ownerId: userId, title: data.title },
      orderBy: { version: 'desc' },
    });

    const nextVersion = lastVersionResume ? lastVersionResume.version + 1 : 1;

    const resume = await this.prismaClient.resume.create({
      data: {
        ownerId: userId,
        uploadedFileId: data.uploadedFileId,
        title: data.title,
        version: nextVersion,
        status: ResumeStatus.DRAFT,
      },
      include: {
        uploadedFile: true,
      },
    }) as unknown as ResumeWithFile;

    this.enrichResumeWithAi(resume.id, file).catch(() => {
      // AI enrichment is best-effort; resume creation succeeds regardless
    });

    return resume;
  }

  private async enrichResumeWithAi(resumeId: string, file: UploadedFile): Promise<void> {
    try {
      const aiProvider = await providers.getAI();
      const parser = await providers.getParser();
      const fileBuffer = await this.storage.downloadFile({ url: file.fileUrl });
      const mimeType = file.fileType;
      const parsed = await parser.parse(fileBuffer, mimeType);

      if (parsed.rawText.length > 0) {
        const parsedData: Prisma.JsonObject = {
          rawText: parsed.rawText,
          skills: parsed.skills,
          experience: JSON.parse(JSON.stringify(parsed.experience)),
          education: JSON.parse(JSON.stringify(parsed.education)),
          summary: parsed.summary,
        };

        await this.prismaClient.resume.update({
          where: { id: resumeId },
          data: { parsedData: parsedData as Prisma.InputJsonValue },
        });
      }
    } catch {
      // Parsing and AI enrichment is best-effort; resume creation succeeds regardless
    }
  }

  async getResume(userId: string, resumeId: string): Promise<ResumeWithFile> {
    const resume = await this.prismaClient.resume.findUnique({
      where: { id: resumeId },
      include: { uploadedFile: true },
    });

    if (!resume || resume.ownerId !== userId || resume.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    return resume;
  }

  async listResumes(userId: string, query: ResumeListQuery = {}): Promise<{ items: ResumeWithFile[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit, skip } = parsePagination(query);

    const where = {
      ownerId: userId,
      deletedAt: null,
    };

    const [items, total] = await Promise.all([
      this.prismaClient.resume.findMany({
        where,
        skip,
        take: limit,
        include: {
          uploadedFile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaClient.resume.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async updateResume(userId: string, resumeId: string, data: UpdateResumeInputDto): Promise<ResumeWithFile> {
    const resume = await this.prismaClient.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.ownerId !== userId || resume.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    return this.prismaClient.resume.update({
      where: { id: resumeId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        uploadedFile: true,
      },
    }) as unknown as ResumeWithFile;
  }

  async deleteResume(userId: string, resumeId: string): Promise<{ resumeId: string }> {
    const resume = await this.prismaClient.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume || resume.ownerId !== userId || resume.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    await this.prismaClient.resume.update({
      where: { id: resumeId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { resumeId };
  }

  async downloadResumeFile(userId: string, resumeId: string): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
    const resume = await this.prismaClient.resume.findUnique({
      where: { id: resumeId },
      include: { uploadedFile: true },
    });

    if (!resume || resume.ownerId !== userId || resume.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    if (!resume.uploadedFile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'FILE_NOT_FOUND', 'No file associated with this resume');
    }

    const buffer = await this.storage.downloadFile({ url: resume.uploadedFile.fileUrl });

    return {
      buffer,
      contentType: resume.uploadedFile.fileType,
      fileName: resume.uploadedFile.fileName,
    };
  }

  public createSignedUrl(file: UploadedFile): string {
    const extension = file.fileName.split('.').pop()?.toLowerCase();
    const resourceType = extension === 'pdf' || extension === 'docx' ? 'raw' : 'image';

    return this.storage.createSignedUrl({
      publicId: file.cloudinaryPublicId,
      resourceType,
    });
  }

  async reparseResume(userId: string, resumeId: string): Promise<ResumeWithFile> {
    const resume = await this.prismaClient.resume.findUnique({
      where: { id: resumeId },
      include: { uploadedFile: true },
    });

    if (!resume || resume.ownerId !== userId || resume.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    if (!resume.uploadedFile) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'FILE_NOT_FOUND', 'No uploaded file associated with this resume');
    }

    await this.enrichResumeWithAi(resume.id, resume.uploadedFile);

    return this.prismaClient.resume.findUnique({
      where: { id: resumeId },
      include: { uploadedFile: true },
    }) as unknown as ResumeWithFile;
  }

  async reparseAllResumes(): Promise<{ reprocessed: number; failed: number }> {
    const resumes = await this.prismaClient.resume.findMany({
      where: { deletedAt: null },
      include: { uploadedFile: true },
    });

    let reprocessed = 0;
    let failed = 0;

    for (const resume of resumes) {
      if (!resume.uploadedFile) {
        failed++;
        continue;
      }
      try {
        await this.enrichResumeWithAi(resume.id, resume.uploadedFile);
        reprocessed++;
      } catch {
        failed++;
      }
    }

    return { reprocessed, failed };
  }

  async recordAuditEvent(eventType: ResumeAuditEventType, input: ResumeAuditInput): Promise<void> {
    try {
      await this.prismaClient.resumeAuditEvent.create({
        data: {
          eventType,
          success: input.success,
          ownerId: input.ownerId,
          resumeId: input.resumeId,
          reason: input.reason,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      });
    } catch {
      // Audit logging must not block user operations
    }
  }
}
