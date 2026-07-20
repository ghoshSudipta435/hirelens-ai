import type { Request, Response } from 'express';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../config/prisma';

export const healthRouter = Router();

export async function sendHealthResponse(_request: Request, response: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    response.status(StatusCodes.OK).json({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    response.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Service unhealthy',
        details: [],
      },
    });
  }
}

export async function sendWorkersHealthResponse(_request: Request, response: Response) {
  const redisConfigured = !!process.env.REDIS_URL;

  response.status(StatusCodes.OK).json({
    success: true,
    data: {
      workers: redisConfigured ? 'running' : 'disabled',
      redis: redisConfigured ? 'configured' : 'not_configured',
      queues: redisConfigured ? ['resume-parse', 'match-score', 'interview-generate'] : [],
      tip: redisConfigured ? undefined : 'Set REDIS_URL env var to enable background workers. Get a free instance at https://redis.com/try-free',
    },
  });
}

healthRouter.get('/health', sendHealthResponse);
healthRouter.get('/workers/health', sendWorkersHealthResponse);
