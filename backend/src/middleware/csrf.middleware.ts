import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'node:crypto';

import { env } from '../config/env';
import { ApiError } from '../utils/api-error';

export const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const CSRF_COOKIE_NAME = 'hirelens_csrf_token';

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfProtection(request: Request, _response: Response, next: NextFunction) {
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  if (SAFE_METHODS.includes(request.method)) {
    next();
    return;
  }

  const headerToken = request.headers[CSRF_HEADER_NAME] as string | undefined;
  const cookieToken = request.cookies?.[CSRF_COOKIE_NAME] as string | undefined;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'CSRF_INVALID', 'CSRF token mismatch'));
    return;
  }

  next();
}

export function csrfTokenEndpoint(_request: Request, response: Response) {
  const token = generateCsrfToken();

  response.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });

  response.json({ success: true, data: { csrfToken: token } });
}
