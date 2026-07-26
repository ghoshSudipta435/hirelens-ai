import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { MatchingService } from './matching.service';
import type { PreviewMatchInputDto } from './matching.schemas';
import type { MatchListQuery } from './matching.types';

type PreviewMatchRequest = Request<never, never, PreviewMatchInputDto>;
type MatchParamsRequest = Request<{ id: string }>;
type ListMatchesRequest = Request<never, never, never, MatchListQuery>;

export class MatchingController {
  constructor(private readonly matchingService: MatchingService = new MatchingService()) {}

  previewMatch = async (request: PreviewMatchRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.matchingService.previewMatch(request.auth!.userId, request.body);

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getMatch = async (request: MatchParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.matchingService.getMatch(
        request.params.id,
        request.auth!.userId,
        request.auth!.role,
      );

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  listMatches = async (request: ListMatchesRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.matchingService.listMatches(
        request.auth!.userId,
        request.auth!.role,
        request.query,
      );

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAutoMatchStatus = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../../config/prisma');
      const userId = request.auth!.userId;

      const results = await prisma.matchResult.groupBy({
        by: ['status'],
        where: {
          resume: { ownerId: userId, deletedAt: null },
          contextType: 'AUTO_MATCH',
          deletedAt: null,
        },
        _count: {
          status: true,
        },
      });

      const statusCounts = results.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
      const completed = (statusCounts['COMPLETED'] || 0) + (statusCounts['FAILED'] || 0);

      response.status(StatusCodes.OK).json({
        success: true,
        data: {
          total,
          completed,
          pending: statusCounts['PENDING'] || 0,
          failed: statusCounts['FAILED'] || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
