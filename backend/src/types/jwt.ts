import type { UserRole } from '@prisma/client';

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  type: 'access';
};

export type RefreshTokenPayload = {
  sub: string;
  tokenId: string;
  type: 'refresh';
};
