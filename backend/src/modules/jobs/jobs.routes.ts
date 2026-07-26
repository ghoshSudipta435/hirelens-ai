import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { authenticateAccessToken, authorizeRoles } from '../auth/auth.middleware';
import { JobController } from './jobs.controller';
import { cacheMiddleware } from '../../middlewares/cache.middleware';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import { createJobRateLimit, updateJobRateLimit } from './jobs.rate-limit';
import { createJobSchema, jobListQuerySchema, jobParamsSchema, updateJobSchema } from './jobs.schemas';

const jobController = new JobController();

export const jobsRouter = Router();

jobsRouter.post(
  '/',
  authenticateAccessToken,
  authorizeRoles('RECRUITER'),
  createJobRateLimit,
  idempotencyMiddleware,
  validateRequest({ body: createJobSchema }),
  jobController.createJob,
);

jobsRouter.get(
  '/',
  authenticateAccessToken,
  cacheMiddleware({ prefix: 'jobs:list', ttlSeconds: 60 }),
  validateRequest({ query: jobListQuerySchema }),
  jobController.listJobs,
);

jobsRouter.get(
  '/:id',
  authenticateAccessToken,
  cacheMiddleware({ prefix: 'jobs:detail', ttlSeconds: 300 }),
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
