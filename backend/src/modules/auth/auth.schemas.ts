import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(UserRole),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1).nullable().optional(),
  })
  .default({})
  .transform((data) => ({
    refreshToken: data.refreshToken ?? undefined,
  }));

export const logoutSchema = refreshTokenSchema;

export type RegisterInputDto = z.infer<typeof registerSchema>;
export type LoginInputDto = z.infer<typeof loginSchema>;
export type RefreshTokenInputDto = z.infer<typeof refreshTokenSchema>;
export type LogoutInputDto = z.infer<typeof logoutSchema>;
