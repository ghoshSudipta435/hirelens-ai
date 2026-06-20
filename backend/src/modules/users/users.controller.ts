import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { UserService } from './users.service';
import type { UserListQuery } from './users.types';

type UserParamsRequest = Request<{ id: string }>;
type ListUsersRequest = Request<never, never, never, UserListQuery>;

export class UserController {
  constructor(private readonly userService: UserService = new UserService()) {}

  getUser = async (request: UserParamsRequest, response: Response, next: NextFunction) => {
    try {
      const user = await this.userService.getUserById(request.params.id);

      if (!user) {
        response.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found', details: [] },
        });
        return;
      }

      response.status(StatusCodes.OK).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (request: ListUsersRequest, response: Response, next: NextFunction) => {
    try {
      const result = await this.userService.listUsers(request.query);

      response.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
