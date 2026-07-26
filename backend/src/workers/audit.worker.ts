import { eventBus } from '../providers/events';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export function startAuditWorker() {
  eventBus.subscribe('AUTH_AUDIT_EVENT', async (payload: any) => {
    try {
      await prisma.authAuditEvent.create({
        data: {
          eventType: payload.eventType,
          success: payload.success,
          userId: payload.userId,
          email: payload.email,
          reason: payload.reason,
          ipAddress: payload.ipAddress || 'unknown',
          userAgent: payload.userAgent || 'unknown',
          metadata: payload.metadata,
        },
      });
      logger.info({ userId: payload.userId, eventType: payload.eventType }, 'Audit log persisted from event bus');
    } catch (err) {
      logger.error({ err, payload }, 'Failed to process AUTH_AUDIT_EVENT');
    }
  });

  logger.info('Audit worker started, listening to Auth events');
}
