import type { Upload, UploadResourceType } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/api-error';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME_TYPES,
  UPLOAD_FOLDER,
  UPLOAD_MAX_FILE_SIZE_BYTES,
} from './uploads.constants';
import { cloudinaryStorage } from '../../providers/storage/cloudinary.storage';
import type { UploadResponseDto } from './uploads.types';

type UploadDelegate = {
  create(args: {
    data: {
      userId: string;
      originalName: string;
      fileExtension: string;
      mimeType: string;
      fileSizeBytes: number;
      cloudinaryPublicId: string;
      cloudinarySecureUrl: string;
      cloudinaryResourceType: UploadResourceType;
    };
  }): Promise<Upload>;
  findUnique(args: {
    where: {
      id: string;
    };
  }): Promise<Upload | null>;
  update(args: {
    where: {
      id: string;
    };
    data: {
      deletedAt?: Date | null;
      cloudinarySecureUrl?: string;
    };
  }): Promise<Upload>;
};

type UploadPrismaClient = {
  upload: UploadDelegate;
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

function toResourceType(extension: string): UploadResourceType {
  if (extension === 'pdf' || extension === 'docx') {
    return 'RAW';
  }

  return 'IMAGE';
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
    this.prismaClient = dependencies.prismaClient ?? prisma;
    this.storage = dependencies.storage ?? cloudinaryStorage;
  }

  async createUpload(userId: string, file: FileLike): Promise<UploadResponseDto> {
    const validated = assertAllowedUpload(file);

    this.runScanHookPlaceholder({
      userId,
      file,
    });

    const uploadResult = await this.storage.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      folder: UPLOAD_FOLDER,
      resourceType: validated.resourceType === 'RAW' ? 'raw' : 'image',
    });

    let upload: Upload;

    try {
      upload = await this.prismaClient.upload.create({
        data: {
          userId,
          originalName: file.originalname,
          fileExtension: validated.extension,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
          cloudinaryPublicId: uploadResult.publicId,
          cloudinarySecureUrl: uploadResult.secureUrl,
          cloudinaryResourceType: validated.resourceType,
        },
      });
    } catch (error) {
      try {
        await this.storage.deleteFile({
          publicId: uploadResult.publicId,
          resourceType: validated.resourceType === 'RAW' ? 'raw' : 'image',
        });
      } catch {
        // Best-effort cleanup only. The original persistence error is the primary failure.
      }

      throw error;
    }

    return {
      upload,
      signedUrl: this.storage.createSignedUrl({
        publicId: upload.cloudinaryPublicId,
        resourceType: upload.cloudinaryResourceType === 'RAW' ? 'raw' : 'image',
      }),
    };
  }

  async getUpload(userId: string, uploadId: string): Promise<UploadResponseDto> {
    const upload = await this.prismaClient.upload.findUnique({
      where: {
        id: uploadId,
      },
    });

    if (!upload || upload.userId !== userId || upload.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'UPLOAD_NOT_FOUND', 'Upload not found');
    }

    return {
      upload,
      signedUrl: this.storage.createSignedUrl({
        publicId: upload.cloudinaryPublicId,
        resourceType: upload.cloudinaryResourceType === 'RAW' ? 'raw' : 'image',
      }),
    };
  }

  async deleteUpload(userId: string, uploadId: string): Promise<{ uploadId: string }> {
    const upload = await this.prismaClient.upload.findUnique({
      where: {
        id: uploadId,
      },
    });

    if (!upload || upload.userId !== userId || upload.deletedAt) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'UPLOAD_NOT_FOUND', 'Upload not found');
    }

    await this.storage.deleteFile({
      publicId: upload.cloudinaryPublicId,
      resourceType: upload.cloudinaryResourceType === 'RAW' ? 'raw' : 'image',
    });

    await this.prismaClient.upload.update({
      where: {
        id: uploadId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      uploadId,
    };
  }

  private runScanHookPlaceholder(_input: { userId: string; file: FileLike }): void {
    return;
  }
}
