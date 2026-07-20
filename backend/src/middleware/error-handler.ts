import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { MulterError } from 'multer';
import { ZodError } from 'zod';

import { logger } from '../config/logger';
import { ApiError } from '../utils/api-error';

const DB_ERROR_PATTERNS = [
  'ENOTFOUND',
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'DATABASE',
  'Connection',
  'Pool',
];

function isDatabaseError(error: Error): boolean {
  const message = error.message ?? '';
  const name = error.name ?? '';
  return DB_ERROR_PATTERNS.some(
    (pattern) => message.includes(pattern) || name.includes(pattern),
  );
}

export function errorHandler(
  error: Error,
  request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });

    return;
  }

  if (error instanceof ZodError) {
    response.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });

    return;
  }

  if (error instanceof MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE';
    response.status(isTooLarge ? StatusCodes.REQUEST_TOO_LONG : StatusCodes.BAD_REQUEST).json({
      success: false,
      error: {
        code: isTooLarge ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
        message: error.message,
        details: [],
      },
    });

    return;
  }

  if (isDatabaseError(error)) {
    logger.error(
      {
        err: error,
        request: {
          method: request.method,
          url: request.originalUrl,
        },
      },
      'Database connection error',
    );

    response.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service is temporarily unavailable. Please try again shortly.',
        details: [],
      },
    });

    return;
  }

  logger.error(
    {
      err: error,
      request: {
        method: request.method,
        url: request.originalUrl,
        userId: (request as { auth?: { userId?: string } }).auth?.userId,
      },
    },
    'Unhandled error',
  );

  response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: [],
    },
  });
}
