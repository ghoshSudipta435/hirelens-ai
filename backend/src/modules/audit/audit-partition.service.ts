import { type PrismaClient } from '@prisma/client';

import { prisma } from '../../config/prisma';
import { logger } from '../../config/logger';

type PrismaClientType = Pick<PrismaClient, 'authAuditEvent' | 'uploadAuditEvent' | 'resumeAuditEvent' | '$executeRawUnsafe'>;

const RETENTION_MONTHS = 12;
const ARCHIVE_MONTHS = 24;

export class AuditPartitionService {
  private readonly prismaClient: PrismaClientType;

  constructor(dependencies: { prismaClient?: PrismaClientType } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
  }

  async getPartitionInfo(): Promise<{ table: string; partition: string; rowCount: bigint }[]> {
    try {
      const result = await this.prismaClient.$executeRawUnsafe(`
        SELECT
          schemaname || '.' || tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
        FROM pg_tables
        WHERE tablename LIKE '%audit_event%'
        ORDER BY tablename
      `);
      return result as unknown as { table: string; partition: string; rowCount: bigint }[];
    } catch (error) {
      logger.warn({ err: error }, 'Failed to get partition info');
      return [];
    }
  }

  async getAuditStats(): Promise<{
    auth: { total: number; last30Days: number };
    upload: { total: number; last30Days: number };
    resume: { total: number; last30Days: number };
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [authTotal, authRecent, uploadTotal, uploadRecent, resumeTotal, resumeRecent] = await Promise.all([
      this.prismaClient.authAuditEvent.count(),
      this.prismaClient.authAuditEvent.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prismaClient.uploadAuditEvent.count(),
      this.prismaClient.uploadAuditEvent.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prismaClient.resumeAuditEvent.count(),
      this.prismaClient.resumeAuditEvent.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return {
      auth: { total: authTotal, last30Days: authRecent },
      upload: { total: uploadTotal, last30Days: uploadRecent },
      resume: { total: resumeTotal, last30Days: resumeRecent },
    };
  }

  async cleanupOldRecords(): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - ARCHIVE_MONTHS);

    logger.info({ cutoffDate }, 'Starting audit record cleanup');

    const [authDeleted, uploadDeleted, resumeDeleted] = await Promise.all([
      this.prismaClient.authAuditEvent.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prismaClient.uploadAuditEvent.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
      this.prismaClient.resumeAuditEvent.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      }),
    ]);

    const totalDeleted = authDeleted.count + uploadDeleted.count + resumeDeleted.count;

    logger.info(
      {
        authDeleted: authDeleted.count,
        uploadDeleted: uploadDeleted.count,
        resumeDeleted: resumeDeleted.count,
        totalDeleted,
      },
      'Audit record cleanup completed'
    );

    return { deleted: totalDeleted };
  }

  async vacuumTables(): Promise<void> {
    const tables = ['AuthAuditEvent', 'UploadAuditEvent', 'ResumeAuditEvent'];

    for (const table of tables) {
      try {
        await this.prismaClient.$executeRawUnsafe(`VACUUM ANALYZE "${table}"`);
        logger.info({ table }, 'Vacuumed audit table');
      } catch (error) {
        logger.warn({ err: error, table }, 'Failed to vacuum audit table');
      }
    }
  }
}

export const auditPartitionService = new AuditPartitionService();
