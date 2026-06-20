import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApplicationService } from './applications.service';
import type { CreateApplicationInputDto, UpdateApplicationStatusInputDto } from './applications.schemas';
import type { ApplicationListQuery } from './applications.types';

type CreateApplicationRequest = Request<never, never, CreateApplicationInputDto>;
type UpdateStatusRequest = Request<{ id: string }, never, UpdateApplicationStatusInputDto>;
type ApplicationParamsRequest = Request<{ id: string }>;
type ListApplicationsRequest = Request<never, never, never, ApplicationListQuery>;

export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService = new ApplicationService()) {}

  createApplication = async (request: CreateApplicationRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.applicationService.createApplication(request.auth!.userId, request.body);

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getApplication = async (request: ApplicationParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.applicationService.getApplication(
        request.auth!.userId,
        request.auth!.role,
        request.params.id,
      );

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  listApplications = async (request: ListApplicationsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.applicationService.listApplications(
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

  updateApplicationStatus = async (request: UpdateStatusRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.applicationService.updateApplicationStatus(
        request.auth!.userId,
        request.params.id,
        request.body,
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
