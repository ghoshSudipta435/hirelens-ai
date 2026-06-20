import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { authenticateAccessToken, authorizeRoles } from '../auth/auth.middleware';
import { InterviewController } from './interview.controller';
import { interviewRateLimit } from './interview.rate-limit';
import { generateQuestionsSchema, questionSetParamsSchema } from './interview.schemas';

const interviewController = new InterviewController();

export const interviewRouter = Router();

interviewRouter.post(
  '/generate',
  authenticateAccessToken,
  authorizeRoles('RECRUITER'),
  interviewRateLimit,
  validateRequest({ body: generateQuestionsSchema }),
  interviewController.generateQuestions,
);

interviewRouter.get(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: questionSetParamsSchema }),
  interviewController.getQuestionSet,
);
