import { rateLimit } from 'express-rate-limit';

const authWindowMs = 15 * 60 * 1000;
const authLoginLimit = 5;
const authRefreshLimit = 20;

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
          message: 'Too many authentication attempts',
          details: [],
        },
      });
    },
  });
}

export const registerRateLimit = createAuthRateLimit(authLoginLimit);
export const loginRateLimit = createAuthRateLimit(authLoginLimit);
export const refreshRateLimit = createAuthRateLimit(authRefreshLimit);
export const logoutRateLimit = createAuthRateLimit(authRefreshLimit);
