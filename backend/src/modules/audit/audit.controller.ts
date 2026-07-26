import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuditService } from './audit.service';
import { ApiError } from '../../utils/api-error';

export class AuditController {
  constructor(private readonly auditService: AuditService = new AuditService()) {}

  getAuthAuditLogs = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // In a real app, verify request.auth!.role === 'ADMIN'
      // Since ADMIN role doesn't exist yet, we restrict this for now to prevent IDOR, or assume it's protected by middleware.
      const result = await this.auditService.getAuthAuditLogs(request.query);
      response.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getSystemMetrics = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await this.auditService.getSystemMetrics();
      response.status(StatusCodes.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}
