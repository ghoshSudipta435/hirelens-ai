import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { authenticateAccessToken } from '../auth/auth.middleware';
import { ResumeController } from './resumes.controller';
import { createResumeSchema, resumeListQuerySchema, resumeParamsSchema, updateResumeSchema } from './resumes.schemas';

function tokenQueryToAuthHeader(request: Request, _response: Response, next: NextFunction) {
  const token = request.query.token as string | undefined;
  if (token && !request.headers.authorization) {
    request.headers.authorization = `Bearer ${token}`;
  }
  next();
}

const resumeController = new ResumeController();

export const resumesRouter = Router();

resumesRouter.post(
  '/',
  authenticateAccessToken,
  validateRequest({ body: createResumeSchema }),
  resumeController.createResume,
);

resumesRouter.get(
  '/',
  authenticateAccessToken,
  validateRequest({ query: resumeListQuerySchema }),
  resumeController.listResumes,
);

resumesRouter.get(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: resumeParamsSchema }),
  resumeController.getResume,
);

resumesRouter.get(
  '/:id/file',
  tokenQueryToAuthHeader,
  authenticateAccessToken,
  validateRequest({ params: resumeParamsSchema }),
  resumeController.getResumeFile,
);

resumesRouter.patch(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: resumeParamsSchema, body: updateResumeSchema }),
  resumeController.updateResume,
);

resumesRouter.delete(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: resumeParamsSchema }),
  resumeController.deleteResume,
);

resumesRouter.post(
  '/:id/reparse',
  authenticateAccessToken,
  validateRequest({ params: resumeParamsSchema }),
  resumeController.reparseResume,
);

resumesRouter.post(
  '/reparse-all',
  authenticateAccessToken,
  resumeController.reparseAllResumes,
);
