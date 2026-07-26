import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet } from '../providers/cache';
import { logger } from '../config/logger';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  if (!idempotencyKey) {
    // If we want to enforce it strictly, we could return 400.
    // For now, we make it optional for backward compatibility.
    return next();
  }

  const cacheKey = `idempotency:${req.auth?.userId || 'anon'}:${idempotencyKey}`;

  try {
    const cachedResponse = await cacheGet<{ statusCode: number; body: unknown }>(cacheKey);

    if (cachedResponse) {
      logger.info({ idempotencyKey }, 'Idempotency key hit, returning cached response');
      res.status(cachedResponse.statusCode).json(cachedResponse.body);
      return;
    }
  } catch (error) {
    logger.error({ err: error }, 'Error checking idempotency cache');
  }

  // Intercept response to save to cache
  const originalJson = res.json.bind(res);

  res.json = (body: unknown) => {
    // Save to cache before sending response (only on success codes to be safe, e.g. 2xx)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cacheSet(
        cacheKey,
        { statusCode: res.statusCode, body },
        { ttlSeconds: 86400 } // Keep idempotency key for 24 hours
      ).catch((err) => {
        logger.error({ err }, 'Failed to save idempotency response to cache');
      });
    }
    
    return originalJson(body);
  };

  next();
};
