import { PrismaClient } from '@prisma/client';

import { env } from './env';

declare global {
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

export const prismaRead = env.READ_DATABASE_URL 
  ? new PrismaClient({
      datasourceUrl: env.READ_DATABASE_URL,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
  : prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma__ = prisma;
}
