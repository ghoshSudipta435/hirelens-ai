import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { authenticateAccessToken, authorizeRoles } from '../auth/auth.middleware';
import { ApplicationController } from './applications.controller';
import {
  applicationListQuerySchema,
  applicationParamsSchema,
  createApplicationSchema,
  updateApplicationStatusSchema,
} from './applications.schemas';

const applicationController = new ApplicationController();

export const applicationsRouter = Router();

applicationsRouter.post(
  '/',
  authenticateAccessToken,
  authorizeRoles('STUDENT'),
  validateRequest({ body: createApplicationSchema }),
  applicationController.createApplication,
);

applicationsRouter.get(
  '/',
  authenticateAccessToken,
  validateRequest({ query: applicationListQuerySchema }),
  applicationController.listApplications,
);

applicationsRouter.get(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: applicationParamsSchema }),
  applicationController.getApplication,
);

applicationsRouter.patch(
  '/:id/status',
  authenticateAccessToken,
  authorizeRoles('RECRUITER'),
  validateRequest({ params: applicationParamsSchema, body: updateApplicationStatusSchema }),
  applicationController.updateApplicationStatus,
);
