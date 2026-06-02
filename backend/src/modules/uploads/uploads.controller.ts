import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../utils/api-error';
import { UploadService } from './uploads.service';

type UploadRequest = Request;
type UploadParamsRequest = Request<{ id: string }>;

export class UploadController {
  constructor(private readonly uploadService: UploadService = new UploadService()) {}

  createUpload = async (request: UploadRequest, response: Response, next: NextFunction) => {
    try {
      if (!request.file) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'FILE_REQUIRED', 'A file is required');
      }

      const result = await this.uploadService.createUpload(request.auth!.userId, request.file);

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getUpload = async (request: UploadParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.uploadService.getUpload(request.auth!.userId, request.params.id);

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUpload = async (request: UploadParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.uploadService.deleteUpload(request.auth!.userId, request.params.id);

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
