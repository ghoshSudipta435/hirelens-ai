import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaMock } from '../fixtures/create-prisma-mock';

describe('AuthService', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = 'test';
    process.env.CLIENT_ORIGIN = 'http://localhost:3000';
    process.env.DATABASE_URL =
      'postgresql://user:pass@ep-test-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require';
    process.env.DIRECT_URL =
      'postgresql://user:pass@ep-test.us-east-2.aws.neon.tech/neondb?sslmode=require';
    process.env.JWT_SECRET = 'test-access-secret-with-at-least-32-characters';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-chars';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
    process.env.BCRYPT_SALT_ROUNDS = '10';
    process.env.LOG_LEVEL = 'silent';
  });

  it('registers a new user and issues access and refresh tokens', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { AuthService } = await import('../../src/modules/auth/auth.service');

    const authService = new AuthService({
      prismaClient: prismaMock,
    });

    const result = await authService.register({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    expect(result.user.email).toBe('ava@example.com');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(state.users).toHaveLength(1);
    expect(state.users[0]?.passwordHash).not.toBe('StrongPassword123!');
    expect(state.studentProfiles).toHaveLength(1);
    expect(state.studentProfiles[0]?.fullName).toBe('Ava Sharma');
    expect(state.refreshTokens).toHaveLength(1);
  });

  it('rejects invalid credentials during login', async () => {
    const { prismaMock } = createPrismaMock();
    const { AuthService } = await import('../../src/modules/auth/auth.service');
    const { PasswordService } = await import('../../src/modules/auth/password.service');

    const passwordService = new PasswordService();
    const passwordHash = await passwordService.hashPassword('StrongPassword123!');

    await prismaMock.user.create({
      data: {
        name: 'Ava Sharma',
        email: 'ava@example.com',
        passwordHash,
        role: 'STUDENT',
      },
    });

    const authService = new AuthService({
      prismaClient: prismaMock,
    });

    await expect(
      authService.login({
        email: 'ava@example.com',
        password: 'WrongPassword123!',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('rotates refresh tokens during refresh', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { AuthService } = await import('../../src/modules/auth/auth.service');

    const authService = new AuthService({
      prismaClient: prismaMock,
    });

    const registered = await authService.register({
      name: 'Ava Sharma',
      email: 'ava@example.com',
      password: 'StrongPassword123!',
      role: 'STUDENT',
    });

    const previousRefreshTokenCount = state.refreshTokens.length;
    const refreshed = await authService.refresh(registered.refreshToken);

    expect(refreshed.refreshToken).not.toBe(registered.refreshToken);
    expect(state.refreshTokens).toHaveLength(previousRefreshTokenCount + 1);
    expect(state.refreshTokens[0]?.revokedAt).toBeInstanceOf(Date);
  });
});
