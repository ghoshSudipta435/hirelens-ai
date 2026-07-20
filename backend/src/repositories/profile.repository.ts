import type { RecruiterProfile, StudentProfile, User } from '@prisma/client';

import { prisma } from '../config/prisma';
import type { RecruiterProfileUpdateInput, StudentProfileUpdateInput } from '../modules/profile/profile.types';

type UserWithProfiles = User & {
  studentProfile?: StudentProfile | null;
  recruiterProfile?: RecruiterProfile | null;
};

export interface IProfileRepository {
  findUserWithProfiles(userId: string): Promise<UserWithProfiles | null>;
  updateStudentProfile(userId: string, data: StudentProfileUpdateInput): Promise<StudentProfile>;
  updateRecruiterProfile(userId: string, data: RecruiterProfileUpdateInput): Promise<RecruiterProfile>;
}

export class ProfileRepository implements IProfileRepository {
  async findUserWithProfiles(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, recruiterProfile: true },
    });
  }

  async updateStudentProfile(userId: string, data: StudentProfileUpdateInput) {
    return prisma.studentProfile.update({ where: { userId }, data });
  }

  async updateRecruiterProfile(userId: string, data: RecruiterProfileUpdateInput) {
    return prisma.recruiterProfile.update({ where: { userId }, data });
  }
}
