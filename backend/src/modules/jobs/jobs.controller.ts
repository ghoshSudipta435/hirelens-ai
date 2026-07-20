import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { logger } from '../../config/logger';
import { JobService } from './jobs.service';
import type { CreateJobInputDto, UpdateJobInputDto } from './jobs.schemas';
import type { JobPostingListQuery } from './jobs.types';

type CreateJobRequest = Request<never, never, CreateJobInputDto>;
type UpdateJobRequest = Request<{ id: string }, never, UpdateJobInputDto>;
type JobParamsRequest = Request<{ id: string }>;
type ListJobsRequest = Request<never, never, never, JobPostingListQuery>;

export class JobController {
  constructor(private readonly jobService: JobService = new JobService()) {}

  createJob = async (request: CreateJobRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.jobService.createJob(request.auth!.userId, request.body);

      logger.info(
        { eventType: 'JOB_CREATED', userId: request.auth?.userId, jobId: result.id, ip: request.ip },
        'Job audit event',
      );

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.warn(
        { eventType: 'JOB_CREATE_FAILED', userId: request.auth?.userId, err: error, ip: request.ip },
        'Job audit event',
      );
      next(error);
    }
  };

  getJob = async (request: JobParamsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.jobService.getJob(request.params.id);

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  listJobs = async (request: ListJobsRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.jobService.listJobs(request.query);

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateJob = async (request: UpdateJobRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.jobService.updateJob(request.auth!.userId, request.params.id, request.body);

      logger.info(
        { eventType: 'JOB_UPDATED', userId: request.auth?.userId, jobId: request.params.id, ip: request.ip },
        'Job audit event',
      );

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.warn(
        { eventType: 'JOB_UPDATE_FAILED', userId: request.auth?.userId, jobId: request.params.id, err: error, ip: request.ip },
        'Job audit event',
      );
      next(error);
    }
  };

  deleteJob = async (request: JobParamsRequest, response: Response, next: NextFunction) => {
    try {
      await this.jobService.deleteJob(request.auth!.userId, request.params.id);

      logger.info(
        { eventType: 'JOB_DELETED', userId: request.auth?.userId, jobId: request.params.id, ip: request.ip },
        'Job audit event',
      );

      response.status(StatusCodes.OK).json({
        success: true,
      });
    } catch (error) {
      logger.warn(
        { eventType: 'JOB_DELETE_FAILED', userId: request.auth?.userId, jobId: request.params.id, err: error, ip: request.ip },
        'Job audit event',
      );
      next(error);
    }
  };
}
