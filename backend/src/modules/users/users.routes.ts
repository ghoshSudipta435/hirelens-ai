import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { authenticateAccessToken, authorizeRoles } from '../auth/auth.middleware';
import { UserController } from './users.controller';
import { userListQuerySchema, userParamsSchema } from './users.schemas';

const userController = new UserController();

export const usersRouter = Router();

usersRouter.get(
  '/',
  authenticateAccessToken,
  authorizeRoles('RECRUITER'),
  validateRequest({ query: userListQuerySchema }),
  userController.listUsers,
);

usersRouter.get(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: userParamsSchema }),
  userController.getUser,
);
