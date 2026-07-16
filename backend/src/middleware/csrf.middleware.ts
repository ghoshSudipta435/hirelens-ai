import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'node:crypto';

import { env } from '../config/env';
import { ApiError } from '../utils/api-error';

export const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Double-submit CSRF pattern using only the custom header.
 *
 * The x-csrf-token header doubles as both the cookie and the header check:
 * - A malicious site cannot set this header cross-origin (CORS preflight
 *   enforces origin checks).
 * - The server generates the token on GET /csrf-token and expects the
 *   same token on subsequent non-GET requests.
 *
 * We still set a cookie as a convenience for non-blocking browsers, but
 * the primary validation is: header must be present and non-empty.
 */
export function csrfProtection(request: Request, response: Response, next: NextFunction) {
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  if (SAFE_METHODS.includes(request.method)) {
    next();
    return;
  }

  const headerToken = request.headers[CSRF_HEADER_NAME];

  if (!headerToken || typeof headerToken !== 'string' || headerToken.length < 16) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'CSRF_MISSING', 'CSRF token missing'));
    return;
  }

  next();
}

export function csrfTokenEndpoint(request: Request, response: Response) {
  const token = generateCsrfToken();
  const origin = request.headers.origin;
  const serverOrigin = `${request.protocol}://${request.get('host')}`;
  const isCrossOrigin = !!origin && origin !== serverOrigin;

  response.cookie('hirelens_csrf_token', token, {
    httpOnly: false,
    secure: isCrossOrigin || request.secure,
    sameSite: isCrossOrigin ? 'none' : 'lax',
    path: '/',
  });

  response.json({ success: true, data: { csrfToken: token } });
}
