import { rateLimit } from 'express-rate-limit';

import {
  UPLOAD_RATE_LIMIT_MAX,
  UPLOAD_RATE_LIMIT_WINDOW_MS,
} from './uploads.constants';

export const uploadRateLimit = rateLimit({
  windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS,
  limit: UPLOAD_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many upload attempts',
        details: [],
      },
    });
  },
});
