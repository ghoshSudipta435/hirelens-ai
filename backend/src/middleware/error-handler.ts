import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';

import { ApiError } from '../utils/api-error';

export function errorHandler(
  error: Error,
  _request: Request,
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

  console.error('[ERROR]', error.stack || error.message);

  const isProduction = process.env.NODE_ENV === 'production';

  response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected error occurred' : (error.message || 'Unexpected server error'),
      details: [],
    },
  });
}
