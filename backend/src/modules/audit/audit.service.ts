import { PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';

export class AuditService {
  constructor(private readonly prismaClient: PrismaClient = prisma as unknown as PrismaClient) {}

  async getAuthAuditLogs(query: { page?: number; limit?: number; userId?: string; eventType?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.eventType) where.eventType = query.eventType;

    const [items, total] = await Promise.all([
      this.prismaClient.authAuditEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaClient.authAuditEvent.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }

  async getSystemMetrics() {
    const [userCount, jobCount, resumeCount, applicationCount] = await Promise.all([
      this.prismaClient.user.count(),
      this.prismaClient.jobPosting.count({ where: { deletedAt: null } }),
      this.prismaClient.resume.count({ where: { deletedAt: null } }),
      this.prismaClient.application.count({ where: { deletedAt: null } }),
    ]);

    return { 
      totalUsers: userCount, 
      totalJobs: jobCount, 
      totalResumes: resumeCount, 
      totalApplications: applicationCount 
    };
  }
}
