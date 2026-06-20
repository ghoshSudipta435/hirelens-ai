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
      const result = await this.matchingService.getMatch(request.params.id);

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
      const result = await this.matchingService.listMatches(request.auth!.userId, request.query);

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
