import type { NextFunction, Request, RequestHandler, Response } from 'express';
import multer from 'multer';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../utils/api-error';
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  UPLOAD_MAX_FILE_SIZE_BYTES,
} from './uploads.constants';

// Use memory storage but with streaming-aware limits
// Multer v2 + memoryStorage buffers the file, but we pipe it to Cloudinary via streaming upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      callback(new ApiError(StatusCodes.UNSUPPORTED_MEDIA_TYPE, 'UNSUPPORTED_FILE_TYPE', 'Unsupported file type'));

      return;
    }

    callback(null, true);
  },
});

function mapMulterError(error: unknown): ApiError | null {
  if (!(error instanceof multer.MulterError)) {
    return null;
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ApiError(
      413,
      'FILE_TOO_LARGE',
      `File must be ${Math.floor(UPLOAD_MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB or smaller`,
    );
  }

  return new ApiError(StatusCodes.BAD_REQUEST, 'FILE_UPLOAD_ERROR', error.message);
}

export function uploadSingleFile(fieldName: string): RequestHandler {
  const single = upload.single(fieldName);

  return (request: Request, response: Response, next: NextFunction) => {
    single(request, response, (error) => {
      if (error) {
        const mappedError =
          error instanceof ApiError ? error : mapMulterError(error);

        next(
          mappedError ??
            new ApiError(StatusCodes.BAD_REQUEST, 'FILE_UPLOAD_ERROR', 'Unable to process upload'),
        );

        return;
      }

      next();
    });
  };
}

// Streaming upload middleware — stores file in memory but exposes stream for piping
// This avoids loading the entire file into a separate buffer during Cloudinary upload
export function uploadSingleFileStream(fieldName: string): RequestHandler {
  const single = upload.single(fieldName);

  return (request: Request, response: Response, next: NextFunction) => {
    single(request, response, (error) => {
      if (error) {
        const mappedError =
          error instanceof ApiError ? error : mapMulterError(error);

        next(
          mappedError ??
            new ApiError(StatusCodes.BAD_REQUEST, 'FILE_UPLOAD_ERROR', 'Unable to process upload'),
        );

        return;
      }

      // Attach a readable stream from the buffer for downstream streaming
      if (request.file) {
        const { Readable } = require('node:stream') as typeof import('node:stream');
        const fileBuffer = request.file.buffer;
        (request.file as Express.Multer.File & { stream: import('node:stream').Readable }).stream = Readable.from(fileBuffer);
      }

      next();
    });
  };
}
