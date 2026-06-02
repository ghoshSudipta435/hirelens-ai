import { randomUUID } from 'node:crypto';

import pino from 'pino';
import pinoHttp from 'pino-http';

import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.refreshToken',
      'req.body.token',
      'body.password',
      'body.refreshToken',
      'body.token',
    ],
    remove: true,
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

export const requestLogger = pinoHttp({
  logger,
  genReqId: (request) => {
    const headerRequestId = request.headers['x-request-id'];

    if (typeof headerRequestId === 'string' && headerRequestId.trim().length > 0) {
      return headerRequestId;
    }

    return randomUUID();
  },
  customProps: (request) => ({
    requestId: request.id,
  }),
});
