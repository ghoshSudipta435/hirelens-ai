import { rateLimit } from 'express-rate-limit';

export const createResumeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many resume creation requests', details: [] },
    });
  },
});

export const updateResumeRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many resume update requests', details: [] },
    });
  },
});
