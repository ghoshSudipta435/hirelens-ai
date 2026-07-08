import type { RecruiterProfile, RefreshToken, StudentProfile, User, UserRole } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/api-error';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import type { AuthResponse, PublicUser } from './auth.types';
import { toPublicUser } from './auth.types';

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type LoginInput = {
  email: string;
  password: string;
};

type UserDelegate = {
  findUnique(args: {
    where: {
      id?: string;
      email?: string;
    };
    include?: {
      studentProfile?: boolean;
      recruiterProfile?: boolean;
    };
  }): Promise<(User & { studentProfile?: StudentProfile | null; recruiterProfile?: RecruiterProfile | null }) | null>;
  create(args: {
    data: {
      name: string;
      email: string;
      passwordHash: string;
      role: UserRole;
    };
  }): Promise<User>;
};

type StudentProfileDelegate = {
  create(args: {
    data: {
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
  }): Promise<StudentProfile>;
  update(args: {
    where: {
      userId: string;
    };
    data: {
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
  }): Promise<StudentProfile>;
};

type RecruiterProfileDelegate = {
  create(args: {
    data: {
      userId: string;
      companyName?: string | null;
      companyWebsite?: string | null;
      designation?: string | null;
      bio?: string | null;
    };
  }): Promise<RecruiterProfile>;
  update(args: {
    where: {
      userId: string;
    };
    data: {
      companyName?: string | null;
      companyWebsite?: string | null;
      designation?: string | null;
      bio?: string | null;
    };
  }): Promise<RecruiterProfile>;
};

type RefreshTokenWithUser = RefreshToken & {
  user: User;
};

type RefreshTokenDelegate = {
  findUnique(args: {
    where: {
      id: string;
    };
    include?: {
      user?: boolean;
    };
  }): Promise<RefreshToken | RefreshTokenWithUser | null>;
  create(args: {
    data: {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
    };
  }): Promise<RefreshToken>;
  update(args: {
    where: {
      id: string;
    };
    data: {
      revokedAt: Date;
    };
  }): Promise<RefreshToken>;
  updateMany(args: {
    where: {
      id?: string;
      userId?: string;
      tokenHash?: string;
      revokedAt?: null;
    };
    data: {
      revokedAt: Date;
    };
  }): Promise<{ count: number }>;
};

type AuthPrismaClient = {
  user: UserDelegate;
  studentProfile: StudentProfileDelegate;
  recruiterProfile: RecruiterProfileDelegate;
  refreshToken: RefreshTokenDelegate;
};

type AuthServiceDependencies = {
  prismaClient?: AuthPrismaClient;
  passwordService?: PasswordService;
  tokenService?: TokenService;
};

type RefreshTokenWriter = {
  refreshToken: Pick<RefreshTokenDelegate, 'create'>;
};

type IssueTokensResult = AuthResponse;

export class AuthService {
  private readonly prismaClient: AuthPrismaClient;
  private readonly passwordService: PasswordService;
  private readonly tokenService: TokenService;

  constructor(dependencies: AuthServiceDependencies = {}) {
    this.prismaClient = dependencies.prismaClient ?? (prisma as unknown as AuthPrismaClient);
    this.passwordService = dependencies.passwordService ?? new PasswordService();
    this.tokenService = dependencies.tokenService ?? new TokenService();
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.prismaClient.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (existingUser) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'EMAIL_ALREADY_IN_USE',
        'An account with this email already exists',
      );
    }

    const passwordHash = await this.passwordService.hashPassword(input.password);

    const user = await this.prismaClient.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
    });

    if (input.role === 'STUDENT') {
      await this.prismaClient.studentProfile.create({
        data: {
          userId: user.id,
          fullName: input.name,
        },
      });
    } else {
      await this.prismaClient.recruiterProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    return this.issueTokensForUser(user);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.prismaClient.user.findUnique({
      where: {
        email: input.email,
      },
    });

    if (!user) {
      throw this.invalidCredentialsError();
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw this.invalidCredentialsError();
    }

    return this.issueTokensForUser(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = this.verifyRefreshTokenOrThrow(refreshToken);
    const tokenHash = this.tokenService.hashToken(refreshToken);

    const existingToken = (await this.prismaClient.refreshToken.findUnique({
      where: {
        id: payload.tokenId,
      },
      include: {
        user: true,
      },
    })) as RefreshTokenWithUser | null;

    if (!existingToken || existingToken.userId !== payload.sub) {
      throw this.invalidRefreshTokenError();
    }

    if (existingToken.revokedAt || existingToken.expiresAt <= new Date()) {
      throw this.invalidRefreshTokenError();
    }

    if (existingToken.tokenHash !== tokenHash) {
      throw this.invalidRefreshTokenError();
    }

    const rotationResult = await this.prismaClient.refreshToken.updateMany({
      where: {
        id: existingToken.id,
        userId: existingToken.userId,
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (rotationResult.count !== 1) {
      throw this.invalidRefreshTokenError();
    }

    return this.issueTokensForUser(existingToken.user);
  }

  async logout(refreshToken: string): Promise<void> {
    let payload;

    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      return;
    }

    const tokenHash = this.tokenService.hashToken(refreshToken);

    await this.prismaClient.refreshToken.updateMany({
      where: {
        id: payload.tokenId,
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.prismaClient.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
    }

    return toPublicUser(user);
  }

  private async issueTokensForUser(
    user: User,
    refreshTokenWriter: RefreshTokenWriter = this.prismaClient,
  ): Promise<IssueTokensResult> {
    const accessToken = this.tokenService.createAccessToken({
      userId: user.id,
      role: user.role,
    });
    const {
      tokenId,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt,
    } = this.tokenService.createRefreshToken({
      userId: user.id,
    });

    await refreshTokenWriter.refreshToken.create({
      data: {
        id: tokenId,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private verifyRefreshTokenOrThrow(refreshToken: string) {
    try {
      return this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw this.invalidRefreshTokenError();
    }
  }

  private invalidCredentialsError(): ApiError {
    return new ApiError(
      StatusCodes.UNAUTHORIZED,
      'INVALID_CREDENTIALS',
      'Invalid email or password',
    );
  }

  private invalidRefreshTokenError(): ApiError {
    return new ApiError(StatusCodes.UNAUTHORIZED, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }
}
