import { Router } from 'express';

import { applicationsRouter } from '../modules/applications/applications.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { interviewRouter } from '../modules/interview/interview.routes';
import { jobsRouter } from '../modules/jobs/jobs.routes';
import { matchingRouter } from '../modules/matching/matching.routes';
import { usersRouter } from '../modules/users/users.routes';
import { profileRouter } from '../modules/profile/profile.routes';
import { resumesRouter } from '../modules/resumes/resumes.routes';
import { uploadsRouter } from '../modules/uploads/uploads.routes';
import { csrfProtection, csrfTokenEndpoint } from '../middleware/csrf.middleware';
import { healthRouter } from './health.route';

export const apiRouter = Router();

apiRouter.get('/', (_request, response) => {
  response.json({
    success: true,
    data: {
      name: 'HireLens AI API',
      version: '1.0.0',
      documentation: '/api/v1/health',
    },
  });
});

apiRouter.use(healthRouter);
apiRouter.get('/csrf-token', csrfTokenEndpoint);
apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', csrfProtection, profileRouter);
apiRouter.use('/resumes', csrfProtection, resumesRouter);
apiRouter.use('/uploads', csrfProtection, uploadsRouter);
apiRouter.use('/applications', csrfProtection, applicationsRouter);
apiRouter.use('/interviews', csrfProtection, interviewRouter);
apiRouter.use('/jobs', csrfProtection, jobsRouter);
apiRouter.use('/matches', csrfProtection, matchingRouter);
apiRouter.use('/users', csrfProtection, usersRouter);
