import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { authenticateAccessToken } from '../auth/auth.middleware';
import { ProfileController } from './profile.controller';
import { profileUpdateBodySchema, profileUserIdParamsSchema } from './profile.schemas';

const profileController = new ProfileController();

export const profileRouter = Router();

profileRouter.get('/', authenticateAccessToken, profileController.getCurrentProfile);
profileRouter.patch('/', authenticateAccessToken, validateRequest({ body: profileUpdateBodySchema }), profileController.updateCurrentProfile);
profileRouter.get(
  '/:userId',
  authenticateAccessToken,
  validateRequest({ params: profileUserIdParamsSchema }),
  profileController.getProfileByUserId,
);
