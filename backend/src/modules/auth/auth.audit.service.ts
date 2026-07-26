import type { AuthEventType, PrismaClient, Prisma } from '@prisma/client';

import { logger } from '../../config/logger';
import { prisma } from '../../config/prisma';
import { eventBus } from '../../providers/events';

type AuthAuditInput = {
  eventType: AuthEventType;
  success: boolean;
  userId?: string;
  email?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
};

type AuthAuditDelegate = Pick<PrismaClient, 'authAuditEvent'>;

export class AuthAuditService {
  constructor(private readonly prismaClient: AuthAuditDelegate = prisma, private readonly auditLogger = logger) {}

  async record(input: AuthAuditInput): Promise<void> {
    try {
      // Publish event asynchronously via EventBus
      await eventBus.publish('AUTH_AUDIT_EVENT', input);
    } catch (error) {
      this.auditLogger.error(
        {
          err: error,
          eventType: input.eventType,
          userId: input.userId,
          email: input.email,
        },
        'Failed to publish auth audit event',
      );
    }

    this.auditLogger.info(
      {
        eventType: input.eventType,
        success: input.success,
        userId: input.userId,
        email: input.email,
        ipAddress: input.ipAddress,
      },
      'Auth audit event published',
    );
  }
}
