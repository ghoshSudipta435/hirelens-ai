import { Router } from 'express';
import { authenticateAccessToken, authorizeRoles } from '../auth/auth.middleware';
import { AuditController } from './audit.controller';

export const auditRouter = Router();
const auditController = new AuditController();

auditRouter.use(authenticateAccessToken);
auditRouter.use(authorizeRoles('ADMIN'));

auditRouter.get('/logs', auditController.getAuthAuditLogs);
auditRouter.get('/metrics', auditController.getSystemMetrics);
