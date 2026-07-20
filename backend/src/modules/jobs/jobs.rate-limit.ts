import { rateLimit } from 'express-rate-limit';

export const createJobRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many job creation requests', details: [] },
    });
  },
});

export const updateJobRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many job update requests', details: [] },
    });
  },
});
