import type { Prisma, RecruiterProfile, RefreshToken, StudentProfile, User, UserRole } from '@prisma/client';

import { prisma } from '../config/prisma';

export type UserCreateInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
};

export type StudentProfileCreateInput = {
  userId: string;
  fullName?: string | null;
  headline?: string | null;
  university?: string | null;
  degree?: string | null;
  graduationYear?: number | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  bio?: string | null;
};

export type StudentProfileUpdateInput = {
  fullName?: string | null;
  headline?: string | null;
  university?: string | null;
  degree?: string | null;
  graduationYear?: number | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  bio?: string | null;
};

export type RecruiterProfileCreateInput = {
  userId: string;
  companyName?: string | null;
  companyWebsite?: string | null;
  designation?: string | null;
  bio?: string | null;
};

export type RecruiterProfileUpdateInput = {
  companyName?: string | null;
  companyWebsite?: string | null;
  designation?: string | null;
  bio?: string | null;
};

export type RefreshTokenCreateInput = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<(User & { studentProfile?: StudentProfile | null; recruiterProfile?: RecruiterProfile | null }) | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: UserCreateInput): Promise<User>;
  createStudentProfile(data: StudentProfileCreateInput): Promise<StudentProfile>;
  createRecruiterProfile(data: RecruiterProfileCreateInput): Promise<RecruiterProfile>;
  updateStudentProfile(userId: string, data: StudentProfileUpdateInput): Promise<StudentProfile>;
  updateRecruiterProfile(userId: string, data: RecruiterProfileUpdateInput): Promise<RecruiterProfile>;
  findRefreshTokenById(id: string): Promise<(RefreshToken & { user?: User }) | null>;
  createRefreshToken(data: RefreshTokenCreateInput): Promise<RefreshToken>;
  revokeRefreshToken(id: string, tokenHash: string, userId: string): Promise<{ count: number }>;
  revokeAllRefreshTokens(userId: string): Promise<void>;
  transaction<T>(fn: (repo: IAuthRepository) => Promise<T>): Promise<T>;
}

export class AuthRepository implements IAuthRepository {
  private readonly tx: Prisma.TransactionClient;

  constructor(tx?: Prisma.TransactionClient) {
    this.tx = tx ?? prisma;
  }

  async findUserByEmail(email: string) {
    return this.tx.user.findUnique({
      where: { email },
      include: { studentProfile: true, recruiterProfile: true },
    });
  }

  async findUserById(id: string) {
    return this.tx.user.findUnique({ where: { id } });
  }

  async createUser(data: UserCreateInput) {
    return this.tx.user.create({ data });
  }

  async createStudentProfile(data: StudentProfileCreateInput) {
    return this.tx.studentProfile.create({ data });
  }

  async createRecruiterProfile(data: RecruiterProfileCreateInput) {
    return this.tx.recruiterProfile.create({ data });
  }

  async updateStudentProfile(userId: string, data: StudentProfileUpdateInput) {
    return this.tx.studentProfile.update({ where: { userId }, data });
  }

  async updateRecruiterProfile(userId: string, data: RecruiterProfileUpdateInput) {
    return this.tx.recruiterProfile.update({ where: { userId }, data });
  }

  async findRefreshTokenById(id: string) {
    return this.tx.refreshToken.findUnique({ where: { id }, include: { user: true } });
  }

  async createRefreshToken(data: RefreshTokenCreateInput) {
    return this.tx.refreshToken.create({ data });
  }

  async revokeRefreshToken(id: string, _tokenHash: string, _userId: string) {
    const result = await this.tx.refreshToken.updateMany({
      where: { id, tokenHash: _tokenHash, userId: _userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { count: result.count };
  }

  async revokeAllRefreshTokens(userId: string) {
    await this.tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async transaction<T>(fn: (repo: IAuthRepository) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => {
      const txRepo = new AuthRepository(tx);
      return fn(txRepo);
    });
  }
}
