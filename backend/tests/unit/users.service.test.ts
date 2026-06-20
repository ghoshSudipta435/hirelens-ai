import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPrismaMock } from '../fixtures/create-prisma-mock';

describe('UserService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('gets a user by id', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { UserService } = await import('../../src/modules/users/users.service');
    const service = new UserService({ prismaClient: prismaMock });

    state.users.push({
      id: 'user-1', name: 'John', email: 'john@test.com', role: 'STUDENT',
      passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date(),
    });

    const user = await service.getUserById('user-1');
    expect(user).not.toBeNull();
    expect(user!.name).toBe('John');
    expect(user!.email).toBe('john@test.com');
  });

  it('returns null for non-existent user', async () => {
    const { prismaMock } = createPrismaMock();
    const { UserService } = await import('../../src/modules/users/users.service');
    const service = new UserService({ prismaClient: prismaMock });

    const user = await service.getUserById('nonexistent');
    expect(user).toBeNull();
  });

  it('lists all users', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { UserService } = await import('../../src/modules/users/users.service');
    const service = new UserService({ prismaClient: prismaMock });

    state.users.push(
      { id: 'user-1', name: 'John', email: 'john@test.com', role: 'STUDENT', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() },
      { id: 'user-2', name: 'Jane', email: 'jane@test.com', role: 'RECRUITER', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() },
    );

    const result = await service.listUsers({ page: 1, limit: 10 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('filters users by role', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { UserService } = await import('../../src/modules/users/users.service');
    const service = new UserService({ prismaClient: prismaMock });

    state.users.push(
      { id: 'user-1', name: 'John', email: 'john@test.com', role: 'STUDENT', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() },
      { id: 'user-2', name: 'Jane', email: 'jane@test.com', role: 'RECRUITER', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() },
    );

    const result = await service.listUsers({ role: 'STUDENT' });
    expect(result.items).toHaveLength(1);
    expect((result.items[0] as any).name).toBe('John');
  });

  it('searches users by name', async () => {
    const { prismaMock, state } = createPrismaMock();
    const { UserService } = await import('../../src/modules/users/users.service');
    const service = new UserService({ prismaClient: prismaMock });

    state.users.push(
      { id: 'user-1', name: 'John Doe', email: 'john@test.com', role: 'STUDENT', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() },
      { id: 'user-2', name: 'Jane Smith', email: 'jane@test.com', role: 'RECRUITER', passwordHash: 'hash', createdAt: new Date(), updatedAt: new Date() },
    );

    const result = await service.listUsers({ search: 'john' });
    expect(result.items).toHaveLength(1);
  });
});
