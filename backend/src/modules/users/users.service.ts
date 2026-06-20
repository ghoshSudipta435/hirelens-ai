import { Prisma, type PrismaClient, type UserRole } from '@prisma/client';

import { prisma } from '../../config/prisma';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';
import type { PublicUser } from '../auth/auth.types';
import type { UserListQuery } from './users.types';

type UserPrismaClient = Pick<PrismaClient, 'user' | '$transaction'>;

export class UserService {
  private readonly prismaClient: UserPrismaClient;

  constructor(dependencies: { prismaClient?: UserPrismaClient } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
  }

  async getUserById(userId: string): Promise<PublicUser | null> {
    const user = await this.prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async listUsers(query: UserListQuery) {
    const { page, limit, skip } = parsePagination(query);

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role as UserRole;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prismaClient.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaClient.user.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }
}
