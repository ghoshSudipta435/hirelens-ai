import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { logger } from '../../config/logger';
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

      logger.info({ applicationId: result.id, userId: request.auth!.userId }, 'Application created');

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

  deleteApplication = async (request: ApplicationParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.applicationService.deleteApplication(
        request.auth!.userId,
        request.auth!.role,
        request.params.id,
      );

      logger.info({ applicationId: result.applicationId, userId: request.auth!.userId }, 'Application deleted');

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  restoreApplication = async (request: ApplicationParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.applicationService.restoreApplication(
        request.auth!.userId,
        request.auth!.role,
        request.params.id,
      );

      logger.info({ applicationId: request.params.id, userId: request.auth!.userId }, 'Application restored');

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

      logger.info(
        { applicationId: request.params.id, status: request.body.status, recruiterId: request.auth!.userId },
        'Application status updated',
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
