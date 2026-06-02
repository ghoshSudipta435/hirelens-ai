import { createHash, randomUUID } from 'node:crypto';

import type { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import type { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';

import { env } from '../../config/env';
import type { AccessTokenPayload, RefreshTokenPayload } from '../../types/jwt';

const JWT_ISSUER = 'hirelens-ai';
const JWT_AUDIENCE = 'hirelens-ai-api';
const JWT_ALGORITHM = 'HS256' as const;

type TokenSubject = {
  userId: string;
  role: UserRole;
};

export class TokenService {
  createAccessToken(input: TokenSubject): string {
    const payload: AccessTokenPayload = {
      sub: input.userId,
      role: input.role,
      type: 'access',
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
  }

  createRefreshToken(input: { userId: string; tokenId?: string }): {
    tokenId: string;
    refreshToken: string;
    refreshTokenHash: string;
    refreshTokenExpiresAt: Date;
  } {
    const tokenId = input.tokenId ?? randomUUID();
    const payload: RefreshTokenPayload = {
      sub: input.userId,
      tokenId,
      type: 'refresh',
    };
    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      algorithm: JWT_ALGORITHM,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    });

    const refreshTokenExpiresAt = this.getTokenExpiry(refreshToken);

    return {
      tokenId,
      refreshToken,
      refreshTokenHash: this.hashToken(refreshToken),
      refreshTokenExpiresAt,
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_SECRET, this.getVerifyOptions()) as AccessTokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, this.getVerifyOptions()) as RefreshTokenPayload;
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getTokenExpiry(token: string): Date {
    const decoded = jwt.decode(token) as JwtPayload | null;

    if (!decoded?.exp) {
      throw new Error('Token does not contain an expiration claim');
    }

    return new Date(decoded.exp * 1000);
  }

  private getVerifyOptions(): VerifyOptions {
    return {
      algorithms: [JWT_ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    };
  }
}
