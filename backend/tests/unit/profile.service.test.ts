import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPrismaMock } from '../fixtures/create-prisma-mock';

describe('ProfileService', () => {
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

  it('returns the authenticated student profile', async () => {
    const { prismaMock } = createPrismaMock();
    const { ProfileService } = await import('../../src/modules/profile/profile.service');

    const user = await prismaMock.user.create({
      data: {
        name: 'Ava Sharma',
        email: 'ava@example.com',
        passwordHash: 'hash',
        role: 'STUDENT',
      },
    });

    await prismaMock.studentProfile.create({
      data: {
        userId: user.id,
        fullName: 'Ava Sharma',
        headline: 'Computer Science Student',
      },
    });

    const profileService = new ProfileService(prismaMock);
    const result = await profileService.getCurrentProfile(user.id);

    expect(result.user.email).toBe('ava@example.com');
    expect(result.profile).toMatchObject({
      userId: user.id,
      fullName: 'Ava Sharma',
      headline: 'Computer Science Student',
    });
  });

  it('updates only the matching role profile', async () => {
    const { prismaMock } = createPrismaMock();
    const { ProfileService } = await import('../../src/modules/profile/profile.service');

    const user = await prismaMock.user.create({
      data: {
        name: 'Ava Sharma',
        email: 'ava@example.com',
        passwordHash: 'hash',
        role: 'STUDENT',
      },
    });

    await prismaMock.studentProfile.create({
      data: {
        userId: user.id,
        fullName: 'Ava Sharma',
      },
    });

    const profileService = new ProfileService(prismaMock);
    const result = await profileService.updateCurrentProfile(user.id, 'STUDENT', {
      headline: 'Incoming Software Engineer',
      githubUrl: 'https://github.com/ava',
    });

    expect(result.profile).toMatchObject({
      userId: user.id,
      headline: 'Incoming Software Engineer',
      githubUrl: 'https://github.com/ava',
    });

    await expect(
      profileService.updateCurrentProfile(user.id, 'RECRUITER', {
        companyName: 'Acme Corp',
      }),
    ).rejects.toMatchObject({
      code: 'PROFILE_ROLE_MISMATCH',
    });
  });

  it('updates recruiter profiles', async () => {
    const { prismaMock } = createPrismaMock();
    const { ProfileService } = await import('../../src/modules/profile/profile.service');

    const user = await prismaMock.user.create({
      data: {
        name: 'Rahul Mehta',
        email: 'rahul@example.com',
        passwordHash: 'hash',
        role: 'RECRUITER',
      },
    });

    await prismaMock.recruiterProfile.create({
      data: {
        userId: user.id,
        companyName: 'Acme Corp',
      },
    });

    const profileService = new ProfileService(prismaMock);
    const result = await profileService.updateCurrentProfile(user.id, 'RECRUITER', {
      companyWebsite: 'https://acme.example',
      designation: 'Talent Partner',
    });

    expect(result.profile).toMatchObject({
      userId: user.id,
      companyName: 'Acme Corp',
      companyWebsite: 'https://acme.example',
      designation: 'Talent Partner',
    });
  });
});
