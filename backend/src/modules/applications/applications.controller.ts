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

      logger.info(
        { eventType: 'APPLICATION_CREATED', userId: request.auth?.userId, applicationId: result.id, ip: request.ip },
        'Application audit event',
      );

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.warn(
        { eventType: 'APPLICATION_CREATE_FAILED', userId: request.auth?.userId, err: error, ip: request.ip },
        'Application audit event',
      );
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

      logger.info(
        { eventType: 'APPLICATION_STATUS_UPDATED', userId: request.auth?.userId, applicationId: request.params.id, status: request.body.status, ip: request.ip },
        'Application audit event',
      );

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.warn(
        { eventType: 'APPLICATION_STATUS_UPDATE_FAILED', userId: request.auth?.userId, applicationId: request.params.id, err: error, ip: request.ip },
        'Application audit event',
      );
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

      logger.info(
        { eventType: 'APPLICATION_DELETED', userId: request.auth?.userId, applicationId: request.params.id, ip: request.ip },
        'Application audit event',
      );

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.warn(
        { eventType: 'APPLICATION_DELETE_FAILED', userId: request.auth?.userId, applicationId: request.params.id, err: error, ip: request.ip },
        'Application audit event',
      );
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

      logger.info(
        { eventType: 'APPLICATION_RESTORED', userId: request.auth?.userId, applicationId: request.params.id, ip: request.ip },
        'Application audit event',
      );

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.warn(
        { eventType: 'APPLICATION_RESTORE_FAILED', userId: request.auth?.userId, applicationId: request.params.id, err: error, ip: request.ip },
        'Application audit event',
      );
      next(error);
    }
  };

  downloadApplicantResume = async (request: ApplicationParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.applicationService.downloadApplicantResume(
        request.auth!.userId,
        request.params.id,
      );

      logger.info(
        { eventType: 'APPLICATION_RESUME_DOWNLOADED', userId: request.auth?.userId, applicationId: request.params.id, ip: request.ip },
        'Application audit event',
      );

      response.setHeader('Content-Type', result.contentType);
      response.setHeader('Content-Disposition', `inline; filename="${result.fileName}"`);
      response.send(result.buffer);
    } catch (error) {
      next(error);
    }
  };
}
