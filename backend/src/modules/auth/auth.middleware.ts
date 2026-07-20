import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../utils/api-error';
import { TokenService } from './token.service';

const tokenService = new TokenService();

export function authenticateAccessToken(request: Request, _response: Response, next: NextFunction) {
  const authorizationHeader = request.headers.authorization;
  let token: string | undefined;

  if (authorizationHeader?.startsWith('Bearer ')) {
    token = authorizationHeader.slice('Bearer '.length);
  } else if (typeof request.query.token === 'string') {
    token = request.query.token;
  }

  if (!token) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', 'Missing access token'));
    return;
  }

  try {
    const payload = tokenService.verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    request.auth = {
      userId: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', 'Invalid or expired access token'));
  }
}

export function authorizeRoles(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'UNAUTHORIZED', 'Authentication required'));

      return;
    }

    if (!roles.includes(request.auth.role)) {
      next(new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'Insufficient permissions'));

      return;
    }

    next();
  };
}
