import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const userParamsSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
});
