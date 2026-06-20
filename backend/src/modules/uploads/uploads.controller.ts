import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../utils/api-error';
import { UploadService } from './uploads.service';
import type { UploadListQuery, UploadedFileResponseDto } from './uploads.types';

type UploadRequest = Request<never, never, never, UploadListQuery>;
type UploadParamsRequest = Request<{ id: string }>;

export class UploadController {
  constructor(private readonly uploadService: UploadService = new UploadService()) {}

  createUpload = async (request: UploadRequest, response: Response, next: NextFunction) => {
    try {
      if (!request.file) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'FILE_REQUIRED', 'A file is required');
      }

      const result = await this.uploadService.createUpload(request.auth!.userId, request.file);

      await this.uploadService.recordAuditEvent('UPLOAD_CREATE', {
        ownerId: request.auth!.userId,
        uploadedFileId: result.uploadedFile.id,
        fileName: result.uploadedFile.fileName,
        success: true,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
        metadata: {
          fileType: result.uploadedFile.fileType,
          fileSize: result.uploadedFile.fileSize,
        },
      });

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: this.mapResponse(result),
      });
    } catch (error) {
      await this.uploadService.recordAuditEvent('UPLOAD_CREATE', {
        ownerId: request.auth!.userId,
        fileName: request.file?.originalname,
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown upload error',
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  getUpload = async (request: UploadParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.uploadService.getUpload(request.auth!.userId, request.params.id);

      await this.uploadService.recordAuditEvent('UPLOAD_GET', {
        ownerId: request.auth!.userId,
        uploadedFileId: result.uploadedFile.id,
        fileName: result.uploadedFile.fileName,
        success: true,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.OK).json({
        success: true,
        data: this.mapResponse(result),
      });
    } catch (error) {
      await this.uploadService.recordAuditEvent('UPLOAD_GET', {
        ownerId: request.auth!.userId,
        uploadedFileId: request.params.id,
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown upload lookup error',
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  deleteUpload = async (request: UploadParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.uploadService.deleteUpload(request.auth!.userId, request.params.id);

      await this.uploadService.recordAuditEvent('UPLOAD_DELETE', {
        ownerId: request.auth!.userId,
        uploadedFileId: result.uploadedFileId,
        success: true,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.OK).json({
        success: true,
      });
    } catch (error) {
      await this.uploadService.recordAuditEvent('UPLOAD_DELETE', {
        ownerId: request.auth!.userId,
        uploadedFileId: request.params.id,
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown upload delete error',
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  listUploads = async (request: UploadRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.uploadService.listUploads(request.auth!.userId, request.query);

      response.status(StatusCodes.OK).json({
        success: true,
        data: {
          items: result.items.map(item => this.mapResponse(item)),
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private mapResponse(result: UploadedFileResponseDto) {
    return {
      id: result.uploadedFile.id,
      fileName: result.uploadedFile.fileName,
      fileSize: result.uploadedFile.fileSize,
      fileType: result.uploadedFile.fileType,
      fileUrl: result.signedUrl,
      createdAt: result.uploadedFile.createdAt,
    };
  }
}

