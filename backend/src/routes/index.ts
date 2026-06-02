import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes';
import { profileRouter } from '../modules/profile/profile.routes';
import { uploadsRouter } from '../modules/uploads/uploads.routes';
import { healthRouter } from './health.route';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/uploads', uploadsRouter);
