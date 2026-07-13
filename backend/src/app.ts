import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { env } from './config/env';
import { requestLogger } from './config/logger';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import { sentryErrorHandler } from './middleware/sentry';
import { apiRouter } from './routes';
import { sendHealthResponse } from './routes/health.route';

const globalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: env.NODE_ENV === 'production' ? 60 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests', details: [] } },
});

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.get('/health', sendHealthResponse);

  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(globalRateLimit);

  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(sentryErrorHandler());
  app.use(errorHandler);

  return app;
}
