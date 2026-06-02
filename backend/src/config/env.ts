import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_ORIGIN: z.string().url(),
  DATABASE_URL: z
    .string()
    .regex(/^postgres(?:ql)?:\/\/.+/i, 'DATABASE_URL must be a PostgreSQL connection string')
    .refine((value) => value.includes('sslmode=require'), {
      message: 'DATABASE_URL must include sslmode=require',
    }),
  DIRECT_URL: z
    .string()
    .regex(/^postgres(?:ql)?:\/\/.+/i, 'DIRECT_URL must be a PostgreSQL connection string')
    .refine((value) => value.includes('sslmode=require'), {
      message: 'DIRECT_URL must include sslmode=require',
    }),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().min(2).default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().min(2).default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  LOG_LEVEL: z.string().default('info'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

function parseEnv(): AppEnv {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${formatted}`);
  }

  return result.data;
}

export const env = parseEnv();
