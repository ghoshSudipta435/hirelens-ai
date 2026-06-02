import type { Request, Response } from 'express';
import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

export const healthRouter = Router();

export function sendHealthResponse(_request: Request, response: Response) {
  response.status(StatusCodes.OK).json({
    success: true,
    data: {
      status: 'ok',
    },
  });
}

healthRouter.get('/health', sendHealthResponse);
