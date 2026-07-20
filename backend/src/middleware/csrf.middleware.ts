import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import crypto from 'node:crypto';

import { env } from '../config/env';
import { ApiError } from '../utils/api-error';

export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_COOKIE_NAME = 'hirelens_csrf_token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Double-submit CSRF pattern using cookie + header comparison.
 *
 * The server sets a CSRF token in a non-httpOnly cookie (readable by JS)
 * and also returns it in the JSON body. The client sends it back via
 * the x-csrf-token header. The middleware validates that the header value
 * matches the cookie value, ensuring the request originated from the same
 * origin (since a cross-origin attacker cannot read the cookie value).
 */
export function csrfProtection(request: Request, _response: Response, next: NextFunction) {
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  if (SAFE_METHODS.includes(request.method)) {
    next();
    return;
  }

  const headerToken = request.headers[CSRF_HEADER_NAME];
  const cookieToken = request.cookies?.[CSRF_COOKIE_NAME];

  if (typeof headerToken !== 'string' || headerToken.length < 16) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'CSRF_MISSING', 'CSRF token missing from header'));
    return;
  }

  if (typeof cookieToken !== 'string' || cookieToken.length < 16) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'CSRF_COOKIE_MISSING', 'CSRF token missing from cookie'));
    return;
  }

  if (!timingSafeEqual(headerToken, cookieToken)) {
    next(new ApiError(StatusCodes.FORBIDDEN, 'CSRF_MISMATCH', 'CSRF token mismatch'));
    return;
  }

  next();
}

export function csrfTokenEndpoint(request: Request, response: Response) {
  const token = generateCsrfToken();
  const origin = request.headers.origin;
  const serverOrigin = `${request.protocol}://${request.get('host')}`;
  const isLocalhostDev = env.NODE_ENV !== 'production' && serverOrigin.includes('localhost');
  const isCrossOrigin = !isLocalhostDev && !!origin && origin !== serverOrigin;

  response.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: isCrossOrigin || request.secure,
    sameSite: isCrossOrigin ? 'none' : 'lax',
    path: '/',
  });

  response.json({ success: true, data: { csrfToken: token } });
}
