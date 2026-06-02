import type {
  RecruiterProfile,
  StudentProfile,
  User,
  UserRole,
} from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/api-error';
import { toPublicUser } from '../auth/auth.types';
import type {
  ProfileResponse,
  RecruiterProfileUpdateInput,
  StudentProfileUpdateInput,
} from './profile.types';

type UserWithProfiles = User & {
  studentProfile?: StudentProfile | null;
  recruiterProfile?: RecruiterProfile | null;
};

type UserDelegate = {
  findUnique(args: {
    where: {
      id?: string;
    };
    include?: {
      studentProfile?: boolean;
      recruiterProfile?: boolean;
    };
  }): Promise<UserWithProfiles | null>;
};

type StudentProfileDelegate = {
  update(args: {
    where: {
      userId: string;
    };
    data: StudentProfileUpdateInput;
  }): Promise<StudentProfile>;
};

type RecruiterProfileDelegate = {
  update(args: {
    where: {
      userId: string;
    };
    data: RecruiterProfileUpdateInput;
  }): Promise<RecruiterProfile>;
};

type ProfilePrismaClient = {
  user: UserDelegate;
  studentProfile: StudentProfileDelegate;
  recruiterProfile: RecruiterProfileDelegate;
};

export class ProfileService {
  constructor(private readonly prismaClient: ProfilePrismaClient = prisma as unknown as ProfilePrismaClient) {}

  async getProfileByUserId(userId: string): Promise<ProfileResponse> {
    const user = await this.prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        studentProfile: true,
        recruiterProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
    }

    return this.toProfileResponse(user);
  }

  async getCurrentProfile(userId: string): Promise<ProfileResponse> {
    return this.getProfileByUserId(userId);
  }

  async updateCurrentProfile(
    userId: string,
    role: UserRole,
    input: StudentProfileUpdateInput | RecruiterProfileUpdateInput,
  ): Promise<ProfileResponse> {
    const user = await this.prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        studentProfile: true,
        recruiterProfile: true,
      },
    });

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'USER_NOT_FOUND', 'User not found');
    }

    if (user.role !== role) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'PROFILE_ROLE_MISMATCH',
        'You cannot modify another role profile',
      );
    }

    if (user.role === 'STUDENT') {
      if (!user.studentProfile) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          'PROFILE_NOT_FOUND',
          'Student profile not found',
        );
      }

      await this.prismaClient.studentProfile.update({
        where: {
          userId,
        },
        data: input,
      });
    } else {
      if (!user.recruiterProfile) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          'PROFILE_NOT_FOUND',
          'Recruiter profile not found',
        );
      }

      await this.prismaClient.recruiterProfile.update({
        where: {
          userId,
        },
        data: input,
      });
    }

    return this.getProfileByUserId(userId);
  }

  private toProfileResponse(user: UserWithProfiles): ProfileResponse {
    if (user.role === 'STUDENT') {
      if (!user.studentProfile) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          'PROFILE_NOT_FOUND',
          'Student profile not found',
        );
      }

      return {
        user: toPublicUser(user),
        profile: user.studentProfile,
      };
    }

    if (!user.recruiterProfile) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'PROFILE_NOT_FOUND',
        'Recruiter profile not found',
      );
    }

    return {
      user: toPublicUser(user),
      profile: user.recruiterProfile,
    };
  }
}
