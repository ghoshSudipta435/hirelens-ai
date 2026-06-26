import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { InterviewService } from './interview.service';
import type { GenerateQuestionsInputDto } from './interview.schemas';

type GenerateQuestionsRequest = Request<never, never, GenerateQuestionsInputDto>;
type QuestionSetParamsRequest = Request<{ id: string }>;

export class InterviewController {
  constructor(private readonly interviewService: InterviewService = new InterviewService()) {}

  generateQuestions = async (request: GenerateQuestionsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.interviewService.generateQuestions(request.auth!.userId, request.body.matchResultId);

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getQuestionSet = async (request: QuestionSetParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.interviewService.getQuestionSet(request.auth!.userId, request.params.id);

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  listQuestionSets = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await this.interviewService.listQuestionSets(
        request.auth!.userId,
        request.auth!.role,
        request.query as { page?: number; limit?: number },
      );

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
