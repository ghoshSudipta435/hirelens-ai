import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export function notFoundHandler(_request: Request, response: Response, _next: NextFunction) {
  response.status(StatusCodes.NOT_FOUND).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      details: [],
    },
  });
}
