import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ResumeService } from './resumes.service';
import type { CreateResumeInputDto, UpdateResumeInputDto } from './resumes.schemas';
import type { ResumeListQuery, ResumeResponseDto, ResumeWithFile } from './resumes.types';

type CreateResumeRequest = Request<never, never, CreateResumeInputDto>;
type UpdateResumeRequest = Request<{ id: string }, never, UpdateResumeInputDto>;
type ResumeParamsRequest = Request<{ id: string }>;
type ListResumesRequest = Request<never, never, never, ResumeListQuery>;

export class ResumeController {
  constructor(private readonly resumeService: ResumeService = new ResumeService()) {}

  createResume = async (request: CreateResumeRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.resumeService.createResume(request.auth!.userId, request.body);

      await this.resumeService.recordAuditEvent('RESUME_CREATED', {
        ownerId: request.auth!.userId,
        resumeId: result.id,
        success: true,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: this.mapResponse(result),
      });
    } catch (error) {
      await this.resumeService.recordAuditEvent('RESUME_CREATED', {
        ownerId: request.auth!.userId,
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  listResumes = async (request: ListResumesRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.resumeService.listResumes(request.auth!.userId, request.query);

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

  getResume = async (request: ResumeParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.resumeService.getResume(request.auth!.userId, request.params.id);

      response.status(StatusCodes.OK).json({
        success: true,
        data: this.mapResponse(result),
      });
    } catch (error) {
      next(error);
    }
  };

  updateResume = async (request: UpdateResumeRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.resumeService.updateResume(request.auth!.userId, request.params.id, request.body);

      await this.resumeService.recordAuditEvent('RESUME_UPDATED', {
        ownerId: request.auth!.userId,
        resumeId: result.id,
        success: true,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.OK).json({
        success: true,
        data: this.mapResponse(result),
      });
    } catch (error) {
      await this.resumeService.recordAuditEvent('RESUME_UPDATED', {
        ownerId: request.auth!.userId,
        resumeId: request.params.id,
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  deleteResume = async (request: ResumeParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.resumeService.deleteResume(request.auth!.userId, request.params.id);

      await this.resumeService.recordAuditEvent('RESUME_DELETED', {
        ownerId: request.auth!.userId,
        resumeId: result.resumeId,
        success: true,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.OK).json({
        success: true,
      });
    } catch (error) {
      await this.resumeService.recordAuditEvent('RESUME_DELETED', {
        ownerId: request.auth!.userId,
        resumeId: request.params.id,
        success: false,
        reason: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  reparseResume = async (request: ResumeParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.resumeService.reparseResume(request.auth!.userId, request.params.id);

      response.status(StatusCodes.OK).json({
        success: true,
        data: this.mapResponse(result),
      });
    } catch (error) {
      next(error);
    }
  };

  getResumeFile = async (request: ResumeParamsRequest, response: Response, next: NextFunction) => {
    try {
      const { buffer, contentType, fileName } = await this.resumeService.downloadResumeFile(
        request.auth!.userId,
        request.params.id,
      );

      response.setHeader('Content-Type', contentType);
      response.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      response.setHeader('Content-Length', buffer.length);
      response.end(buffer);
    } catch (error) {
      next(error);
    }
  };

  reparseAllResumes = async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await this.resumeService.reparseAllResumes();

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  private mapResponse(result: ResumeWithFile): ResumeResponseDto {
    return {
      id: result.id,
      ownerId: result.ownerId,
      uploadedFileId: result.uploadedFileId,
      title: result.title,
      version: result.version,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      fileUrl: this.resumeService.createSignedUrl(result.uploadedFile),
    };
  }
}
