import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'node:crypto';

import { env } from '../config/env';
import { ApiError } from '../utils/api-error';

export const CSRF_COOKIE_NAME = 'hirelens_csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(request: Request, response: Response): string {
  const token = generateCsrfToken();
  const origin = request.headers.origin;
  const serverOrigin = `${request.protocol}://${request.get('host')}`;
  const isCrossOrigin = !!origin && origin !== serverOrigin;

  response.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: isCrossOrigin || request.secure,
    sameSite: isCrossOrigin ? 'none' : 'lax',
    path: '/',
  });
  return token;
}

export function csrfProtection(request: Request, response: Response, next: NextFunction) {
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  if (SAFE_METHODS.includes(request.method)) {
    next();
    return;
  }

  const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = request.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'CSRF_MISSING', 'CSRF token missing'));
    return;
  }

  if (cookieToken !== headerToken) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'CSRF_INVALID', 'CSRF token mismatch'));
    return;
  }

  next();
}

export function csrfTokenEndpoint(request: Request, response: Response) {
  const token = setCsrfCookie(request, response);
  response.json({ success: true, data: { csrfToken: token } });
}
