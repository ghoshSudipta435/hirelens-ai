import type { NextFunction, Request, Response } from 'express';
import { cacheGet, cacheSet } from '../providers/cache';
import { logger } from '../config/logger';

interface CacheMiddlewareOptions {
  ttlSeconds?: number;
  prefix?: string;
  keyPrefix?: string;
}

export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const { ttlSeconds = 300, prefix = 'api', keyPrefix = '' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Determine a cache key based on URL and query params.
    let cacheKey = `${prefix}:${req.originalUrl || req.url}`;
    
    // Add user context if the route is authenticated and we want user-specific caching
    if (keyPrefix === 'user') {
      const userId = (req as any).auth?.userId || 'anonymous';
      cacheKey = `${prefix}:${userId}:${req.originalUrl || req.url}`;
    } else if (keyPrefix) {
      cacheKey = `${prefix}:${keyPrefix}:${req.originalUrl || req.url}`;
    }

    try {
      const cachedResponse = await cacheGet<string>(cacheKey);

      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedResponse);
      }

      res.setHeader('X-Cache', 'MISS');

      // Intercept the res.send and res.json methods to capture the response body
      const originalSend = res.send;
      const originalJson = res.json;

      let responseSent = false;

      // Type-cast to any to safely override the Express methods
      (res as any).send = function (body: any): Response {
        if (!responseSent) {
          responseSent = true;
          // Only cache successful JSON responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            let stringBody = typeof body === 'string' ? body : JSON.stringify(body);
            // Cache asynchronously so it doesn't block the request
            cacheSet(cacheKey, stringBody, { ttlSeconds }).catch(err => {
              logger.error({ err, cacheKey }, 'Failed to set cache in middleware');
            });
          }
        }
        return originalSend.call(this, body);
      };

      (res as any).json = function (body: any): Response {
        if (!responseSent) {
          responseSent = true;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            cacheSet(cacheKey, JSON.stringify(body), { ttlSeconds }).catch(err => {
              logger.error({ err, cacheKey }, 'Failed to set cache in middleware');
            });
          }
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (err) {
      logger.error({ err, cacheKey }, 'Cache middleware error');
      next(); // Fail open - if cache fails, proceed with request
    }
  };
}
