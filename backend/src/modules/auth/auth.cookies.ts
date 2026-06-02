import type { CookieOptions } from 'express';

import { env } from '../../config/env';

export const REFRESH_TOKEN_COOKIE_NAME = 'hirelens_refresh_token';
const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

export function buildRefreshTokenCookieOptions(expiresAt: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: REFRESH_TOKEN_COOKIE_PATH,
    expires: expiresAt,
  };
}

export function buildClearedRefreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: REFRESH_TOKEN_COOKIE_PATH,
    expires: new Date(0),
  };
}
