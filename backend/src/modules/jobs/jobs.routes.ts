import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { authenticateAccessToken, authorizeRoles } from '../auth/auth.middleware';
import { JobController } from './jobs.controller';
import { createJobRateLimit, updateJobRateLimit } from './jobs.rate-limit';
import { createJobSchema, jobListQuerySchema, jobParamsSchema, updateJobSchema } from './jobs.schemas';

const jobController = new JobController();

export const jobsRouter = Router();

jobsRouter.post(
  '/',
  authenticateAccessToken,
  authorizeRoles('RECRUITER'),
  createJobRateLimit,
  validateRequest({ body: createJobSchema }),
  jobController.createJob,
);

jobsRouter.get(
  '/',
  authenticateAccessToken,
  validateRequest({ query: jobListQuerySchema }),
  jobController.listJobs,
);

jobsRouter.get(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: jobParamsSchema }),
  jobController.getJob,
);

jobsRouter.patch(
  '/:id',
  authenticateAccessToken,
  authorizeRoles('RECRUITER'),
  updateJobRateLimit,
  validateRequest({ params: jobParamsSchema, body: updateJobSchema }),
  jobController.updateJob,
);

jobsRouter.delete(
  '/:id',
  authenticateAccessToken,
  authorizeRoles('RECRUITER'),
  validateRequest({ params: jobParamsSchema }),
  jobController.deleteJob,
);
