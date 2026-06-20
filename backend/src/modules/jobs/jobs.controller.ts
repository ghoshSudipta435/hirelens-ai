import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

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

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: result,
      });
    } catch (error) {
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

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteJob = async (request: JobParamsRequest, response: Response, next: NextFunction) => {
    try {
      await this.jobService.deleteJob(request.auth!.userId, request.params.id);

      response.status(StatusCodes.OK).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  };
}
