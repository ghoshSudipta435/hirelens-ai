import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { authenticateAccessToken, authorizeRoles } from '../auth/auth.middleware';
import { MatchingController } from './matching.controller';
import { matchingRateLimit } from './matching.rate-limit';
import { matchListQuerySchema, matchParamsSchema, previewMatchSchema } from './matching.schemas';

const matchingController = new MatchingController();

export const matchingRouter = Router();

matchingRouter.post(
  '/preview',
  authenticateAccessToken,
  authorizeRoles('STUDENT', 'ADMIN'),
  matchingRateLimit,
  validateRequest({ body: previewMatchSchema }),
  matchingController.previewMatch,
);

matchingRouter.get(
  '/status',
  authenticateAccessToken,
  authorizeRoles('STUDENT', 'ADMIN'),
  matchingController.getAutoMatchStatus,
);

matchingRouter.get(
  '/',
  authenticateAccessToken,
  validateRequest({ query: matchListQuerySchema }),
  matchingController.listMatches,
);

matchingRouter.get(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: matchParamsSchema }),
  matchingController.getMatch,
);
