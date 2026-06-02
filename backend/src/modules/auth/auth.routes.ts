import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { AuthController } from './auth.controller';
import { authenticateAccessToken } from './auth.middleware';
import {
  loginRateLimit,
  logoutRateLimit,
  refreshRateLimit,
  registerRateLimit,
} from './auth.rate-limit';
import { loginSchema, logoutSchema, refreshTokenSchema, registerSchema } from './auth.schemas';

const authController = new AuthController();

export const authRouter = Router();

authRouter.post(
  '/register',
  registerRateLimit,
  validateRequest({ body: registerSchema }),
  authController.register,
);
authRouter.post(
  '/login',
  loginRateLimit,
  validateRequest({ body: loginSchema }),
  authController.login,
);
authRouter.post(
  '/refresh',
  refreshRateLimit,
  validateRequest({ body: refreshTokenSchema }),
  authController.refresh,
);
authRouter.post(
  '/logout',
  logoutRateLimit,
  validateRequest({ body: logoutSchema }),
  authController.logout,
);
authRouter.get('/profile', authenticateAccessToken, authController.profile);
