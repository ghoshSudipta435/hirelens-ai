import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

import { env } from './env';

neonConfig.webSocketConstructor = ws;

declare global {
  var __prisma__: PrismaClient | undefined;
}

const isNeon = env.DATABASE_URL.includes('neon.tech');

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    ...(isNeon && { adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }) }),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

export const prismaRead = env.READ_DATABASE_URL 
  ? new PrismaClient({
      ...(isNeon && { adapter: new PrismaNeon({ connectionString: env.READ_DATABASE_URL }) }),
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
  : prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma__ = prisma;
}
