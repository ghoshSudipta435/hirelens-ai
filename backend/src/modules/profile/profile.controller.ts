import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { parseProfileUpdateInput } from './profile.schemas';
import { ProfileService } from './profile.service';

type ProfileRequest = Request;
type ProfileParamsRequest = Request<{ userId: string }>;

export class ProfileController {
  constructor(private readonly profileService: ProfileService = new ProfileService()) {}

  getCurrentProfile = async (request: ProfileRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.profileService.getCurrentProfile(request.auth!.userId);

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCurrentProfile = async (request: ProfileRequest, response: Response, next: NextFunction) => {
    try {
      const parsedBody = parseProfileUpdateInput(request.auth!.role, request.body);
      const result = await this.profileService.updateCurrentProfile(
        request.auth!.userId,
        request.auth!.role,
        parsedBody,
      );

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getProfileByUserId = async (
    request: ProfileParamsRequest,
    response: Response,
    next: NextFunction,
  ) => {
    try {
      const result = await this.profileService.getProfileByUserId(request.params.userId);

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
