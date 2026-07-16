import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { logger } from '../../config/logger';
import { ApiError } from '../../utils/api-error';
import { AuthAuditService } from './auth.audit.service';
import {
  buildClearedRefreshTokenCookieOptions,
  buildRefreshTokenCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
} from './auth.cookies';
import { AuthService } from './auth.service';
import type {
  LoginInputDto,
  LogoutInputDto,
  RefreshTokenInputDto,
  RegisterInputDto,
} from './auth.schemas';

type RegisterRequest = Request<never, never, RegisterInputDto>;
type LoginRequest = Request<never, never, LoginInputDto>;
type RefreshRequest = Request<never, never, RefreshTokenInputDto>;
type LogoutRequest = Request<never, never, LogoutInputDto>;
type ProfileRequest = Request;
type RefreshTokenSourceRequest = {
  body: {
    refreshToken?: unknown;
  };
  cookies?: Record<string, string | undefined>;
};

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}
  private readonly auditService = new AuthAuditService();

  register = async (request: RegisterRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(request.body);

      response.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        result.refreshToken,
        buildRefreshTokenCookieOptions(result.refreshTokenExpiresAt),
      );

      await this.recordAuditEvent({
        eventType: 'REGISTER',
        success: true,
        userId: result.user.id,
        email: result.user.email,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.CREATED).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        },
      });
    } catch (error) {
      await this.recordAuditEvent({
        eventType: 'REGISTER',
        success: false,
        email: request.body.email,
        reason: this.getAuditReason(error),
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  login = async (request: LoginRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.authService.login(request.body);

      response.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        result.refreshToken,
        buildRefreshTokenCookieOptions(result.refreshTokenExpiresAt),
      );

      await this.recordAuditEvent({
        eventType: 'LOGIN',
        success: true,
        userId: result.user.id,
        email: result.user.email,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.OK).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        },
      });
    } catch (error) {
      await this.recordAuditEvent({
        eventType: 'LOGIN',
        success: false,
        email: request.body.email,
        reason: this.getAuditReason(error),
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  refresh = async (request: RefreshRequest, response: Response, next: NextFunction) => {
    try {
      const refreshToken = this.getRefreshTokenFromRequest(request);
      const result = await this.authService.refresh(refreshToken);

      response.cookie(
        REFRESH_TOKEN_COOKIE_NAME,
        result.refreshToken,
        buildRefreshTokenCookieOptions(result.refreshTokenExpiresAt),
      );

      await this.recordAuditEvent({
        eventType: 'REFRESH',
        success: true,
        userId: result.user.id,
        email: result.user.email,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.OK).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        },
      });
    } catch (error) {
      await this.recordAuditEvent({
        eventType: 'REFRESH',
        success: false,
        reason: this.getAuditReason(error),
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  logout = async (request: LogoutRequest, response: Response, next: NextFunction) => {
    try {
      const refreshToken = this.getRefreshTokenFromRequest(request);
      await this.authService.logout(refreshToken);

      response.clearCookie(
        REFRESH_TOKEN_COOKIE_NAME,
        buildClearedRefreshTokenCookieOptions(),
      );

      await this.recordAuditEvent({
        eventType: 'LOGOUT',
        success: true,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.OK).json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });
    } catch (error) {
      await this.recordAuditEvent({
        eventType: 'LOGOUT',
        success: false,
        reason: this.getAuditReason(error),
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  profile = async (request: ProfileRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.authService.getProfile(request.auth!.userId);

      await this.recordAuditEvent({
        eventType: 'PROFILE',
        success: true,
        userId: result.id,
        email: result.email,
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      await this.recordAuditEvent({
        eventType: 'PROFILE',
        success: false,
        reason: this.getAuditReason(error),
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
      });
      next(error);
    }
  };

  private getRefreshTokenFromRequest(request: RefreshTokenSourceRequest): string {
    const bodyToken = request.body.refreshToken;
    const cookies = request.cookies;
    const cookieToken = cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    const refreshToken = cookieToken ?? bodyToken;

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'MISSING_REFRESH_TOKEN', 'Refresh token is required');
    }

    return refreshToken;
  }

  private getAuditReason(error: unknown): string {
    if (error instanceof ApiError) {
      return error.code;
    }

    return 'UNKNOWN_ERROR';
  }

  private async recordAuditEvent(input: Parameters<AuthAuditService['record']>[0]): Promise<void> {
    try {
      await this.auditService.record(input);
    } catch (error) {
      logger.warn({ err: error }, 'Failed to record auth audit event');
    }
  }
}
