import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ZodTypeAny } from 'zod';

import { ApiError } from '../utils/api-error';

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        request.body = schemas.body.parse(request.body);
      }

      if (schemas.params) {
        request.params = schemas.params.parse(request.params) as Request['params'];
      }

      if (schemas.query) {
        const parsedQuery = schemas.query.parse(request.query);
        try {
          request.query = parsedQuery as Request['query'];
        } catch {
          Object.defineProperty(request, 'query', {
            value: parsedQuery,
            writable: true,
            configurable: true,
          });
        }
      }

      next();
    } catch (error) {
      next(
        new ApiError(
          StatusCodes.BAD_REQUEST,
          'VALIDATION_ERROR',
          'Invalid request payload',
          error instanceof Error ? [error.message] : [],
        ),
      );
    }
  };
}
