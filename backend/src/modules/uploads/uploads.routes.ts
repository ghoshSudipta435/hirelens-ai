import { Router } from 'express';

import { validateRequest } from '../../middleware/validate-request';
import { authenticateAccessToken } from '../auth/auth.middleware';
import { uploadSingleFile } from './uploads.middleware';
import { uploadRateLimit } from './uploads.rate-limit';
import { UploadController } from './uploads.controller';
import { uploadParamsSchema } from './uploads.schemas';

const uploadController = new UploadController();

export const uploadsRouter = Router();

uploadsRouter.post(
  '/',
  authenticateAccessToken,
  uploadRateLimit,
  uploadSingleFile('file'),
  uploadController.createUpload,
);
uploadsRouter.get(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: uploadParamsSchema }),
  uploadController.getUpload,
);
uploadsRouter.delete(
  '/:id',
  authenticateAccessToken,
  validateRequest({ params: uploadParamsSchema }),
  uploadController.deleteUpload,
);
