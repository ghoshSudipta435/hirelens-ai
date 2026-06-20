import { rateLimit } from 'express-rate-limit';

import { env } from '../../config/env';

const isDev = env.NODE_ENV === 'development';

// Production: strict limits. Development: generous limits for iteration.
const authWindowMs = isDev ? 5 * 60 * 1000 : 15 * 60 * 1000; // 5min dev, 15min prod
const loginLimit = isDev ? 50 : 5;
const registerLimit = isDev ? 50 : 5;
const refreshLimit = isDev ? 200 : 20;
const logoutLimit = isDev ? 200 : 20;

function createAuthRateLimit(limit: number) {
  return rateLimit({
    windowMs: authWindowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many authentication attempts. Please try again later.',
          details: [],
        },
      });
    },
  });
}

export const registerRateLimit = createAuthRateLimit(registerLimit);
export const loginRateLimit = createAuthRateLimit(loginLimit);
export const refreshRateLimit = createAuthRateLimit(refreshLimit);
export const logoutRateLimit = createAuthRateLimit(logoutLimit);
