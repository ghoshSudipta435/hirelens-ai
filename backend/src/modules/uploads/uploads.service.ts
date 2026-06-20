import type { UploadAuditEventType, UploadedFile } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/api-error';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME_TYPES,
  UPLOAD_FOLDER,
  UPLOAD_MAX_FILE_SIZE_BYTES,
} from './uploads.constants';
import { cloudinaryStorage } from '../../providers/storage/cloudinary.storage';
import type { UploadAuditInput, UploadedFileResponseDto, UploadListQuery } from './uploads.types';

type UploadDelegate = {
  create(args: {
    data: {
      ownerId: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      cloudinaryPublicId: string;
      fileUrl: string;
    };
  }): Promise<UploadedFile>;
  findUnique(args: {
    where: {
      id: string;
    };
  }): Promise<UploadedFile | null>;
  update(args: {
    where: {
      id: string;
    };
    data: {
      deletedAt?: Date | null;
      fileUrl?: string;
    };
  }): Promise<UploadedFile>;
  findMany(args: {
    where: {
      ownerId: string;
      deletedAt: null;
    };
    orderBy: {
      createdAt: 'desc';
    };
    skip?: number;
    take?: number;
  }): Promise<UploadedFile[]>;
  count(args: {
    where: {
      ownerId: string;
      deletedAt: null;
    };
  }): Promise<number>;
};

type UploadPrismaClient = {
  uploadedFile: UploadDelegate;
  uploadAuditEvent: {
    create(args: {
      data: {
        eventType: UploadAuditEventType;
        success: boolean;
        ownerId?: string;
        uploadedFileId?: string;
        fileName?: string;
        reason?: string;
        ipAddress?: string;
        userAgent?: string;
        metadata?: Record<string, unknown>;
      };
    }): Promise<unknown>;
  };
};

type UploadServiceDependencies = {
  prismaClient?: UploadPrismaClient;
  storage?: typeof cloudinaryStorage;
};

type FileLike = Express.Multer.File;

function normalizeExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf('.');

  if (lastDotIndex === -1) {
    return '';
  }

  const extension = fileName.slice(lastDotIndex + 1).toLowerCase();

  if (extension === 'jpeg') {
    return 'jpg';
  }

  return extension;
}

function toResourceType(extension: string): 'image' | 'raw' {
  if (extension === 'pdf' || extension === 'docx') {
    return 'raw';
  }

  return 'image';
}

function assertAllowedUpload(file: FileLike) {
  const extension = normalizeExtension(file.originalname);

  if (!extension || !ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
    throw new ApiError(
      StatusCodes.UNSUPPORTED_MEDIA_TYPE,
      'UNSUPPORTED_FILE_TYPE',
      'Unsupported file extension',
    );
  }

  if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
    throw new ApiError(
      StatusCodes.UNSUPPORTED_MEDIA_TYPE,
      'UNSUPPORTED_FILE_TYPE',
      'Unsupported file MIME type',
    );
  }

  const expectedMimeByExtension: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    png: 'image/png',
    jpg: 'image/jpeg',
  };

  const expectedMime = expectedMimeByExtension[extension];

  if (expectedMime && file.mimetype !== expectedMime) {
    throw new ApiError(
      StatusCodes.UNSUPPORTED_MEDIA_TYPE,
      'UNSUPPORTED_FILE_TYPE',
      'File extension and MIME type do not match',
    );
  }

  if (file.size > UPLOAD_MAX_FILE_SIZE_BYTES) {
    throw new ApiError(
      413,
      'FILE_TOO_LARGE',
      `File must be ${Math.floor(UPLOAD_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB or smaller`,
    );
  }

  return {
    extension,
    resourceType: toResourceType(extension),
  };
}

export class UploadService {
  private readonly prismaClient: UploadPrismaClient;
  private readonly storage: typeof cloudinaryStorage;

  constructor(dependencies: UploadServiceDependencies = {}) {
    this.prismaClient = dependencies.prismaClient ?? (prisma as unknown as UploadPrismaClient);
    this.storage = dependencies.storage ?? cloudinaryStorage;
  }

  async createUpload(userId: string, file: FileLike): Promise<UploadedFileResponseDto> {
    const validated = assertAllowedUpload(file);

    const uploadResult = await this.storage.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      folder: UPLOAD_FOLDER,
      resourceType: validated.resourceType,
    });

    let uploadedFile: UploadedFile;

    try {
      uploadedFile = await this.prismaClient.uploadedFile.create({
        data: {
          ownerId: userId,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          cloudinaryPublicId: uploadResult.publicId,
          fileUrl: uploadResult.secureUrl,
        },
      });
    } catch (error) {
      try {
        await this.storage.deleteFile({
          publicId: uploadResult.publicId,
          resourceType: validated.resourceType,
        });
      } catch {
        // Best-effort cleanup only. The original persistence error is the primary failure.
      }

      throw error;
    }

    return {
      uploadedFile,
      signedUrl: this.storage.createSignedUrl({
        publicId: uploadedFile.cloudinaryPublicId,
        resourceType: validated.resourceType,
      }),
    };
  }

  async getUpload(userId: string, uploadId: string): Promise<UploadedFileResponseDto> {
    const uploadedFile = await this.prismaClient.uploadedFile.findUnique({
      where: {
        id: uploadId,
      },
    });

    if (!uploadedFile || uploadedFile.ownerId !== userId || uploadedFile.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'UPLOAD_NOT_FOUND', 'Upload not found');
    }

    return {
      uploadedFile,
      signedUrl: this.storage.createSignedUrl({
        publicId: uploadedFile.cloudinaryPublicId,
        resourceType: toResourceType(normalizeExtension(uploadedFile.fileName)),
      }),
    };
  }

  async deleteUpload(userId: string, uploadId: string): Promise<{ uploadedFileId: string }> {
    const uploadedFile = await this.prismaClient.uploadedFile.findUnique({
      where: {
        id: uploadId,
      },
    });

    if (!uploadedFile || uploadedFile.ownerId !== userId || uploadedFile.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'UPLOAD_NOT_FOUND', 'Upload not found');
    }

    await this.storage.deleteFile({
      publicId: uploadedFile.cloudinaryPublicId,
      resourceType: toResourceType(normalizeExtension(uploadedFile.fileName)),
    });

    await this.prismaClient.uploadedFile.update({
      where: {
        id: uploadId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      uploadedFileId: uploadId,
    };
  }

  async listUploads(userId: string, query: UploadListQuery = {}): Promise<{ items: UploadedFileResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page, limit, skip } = parsePagination(query);

    const where = {
      ownerId: userId,
      deletedAt: null,
    };

    const [uploadedFiles, total] = await Promise.all([
      this.prismaClient.uploadedFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaClient.uploadedFile.count({ where }),
    ]);

    const items = uploadedFiles.map(uploadedFile => ({
      uploadedFile,
      signedUrl: this.storage.createSignedUrl({
        publicId: uploadedFile.cloudinaryPublicId,
        resourceType: toResourceType(normalizeExtension(uploadedFile.fileName)),
      }),
    }));

    return buildPaginatedResponse(items, total, page, limit);
  }

  async recordAuditEvent(eventType: UploadAuditEventType, input: UploadAuditInput): Promise<void> {
    try {
      await this.prismaClient.uploadAuditEvent.create({
        data: {
          eventType,
          success: input.success,
          ownerId: input.ownerId,
          uploadedFileId: input.uploadedFileId,
          fileName: input.fileName,
          reason: input.reason,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          metadata: input.metadata,
        },
      });
    } catch {
      // Audit logging must not block the user-facing upload workflow.
    }
  }}
