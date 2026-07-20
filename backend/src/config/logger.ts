import { randomUUID } from 'node:crypto';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from './env';

// Completely safe runtime verification function that works across both ESM and CommonJS modes
function getTransport() {
  if (env.NODE_ENV !== 'development') {
    return undefined;
  }

  try {
    // If running under standard compiled Node paths, verify its accessibility synchronously 
    const isAvailable = require.resolve('pino-pretty');
    if (isAvailable) {
      return {
        target: 'pino-pretty',
        options: { colorize: true },
      };
    }
  } catch (e) {
    // pino-pretty isn't available in production layers (Expected)
  }

  return undefined;
}

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
  transport: getTransport(),
});

export const requestLogger = pinoHttp({
  logger,
  serializers: {
    req: (req) => {
      const url = req.url ? req.url.replace(/([?&]token=)[^&]+/, '$1[REDACTED]') : req.url;
      // We mutate the raw req object temporarily for logging, but pino-http already copies it
      // To be safe, we just return the standard serialized req with the replaced URL
      const serialized = pino.stdSerializers.req(req);
      serialized.url = url;
      return serialized;
    },
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
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