import { randomUUID } from 'node:crypto';

import type {
  AuthEventType,
  RecruiterProfile,
  RefreshToken,
  Upload,
  UploadResourceType,
  StudentProfile,
  User,
  UserRole,
} from '@prisma/client';

type UserCreateInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
};

type StudentProfileCreateInput = {
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

type RecruiterProfileCreateInput = {
  userId: string;
  companyName?: string | null;
  companyWebsite?: string | null;
  designation?: string | null;
  bio?: string | null;
};

type StudentProfileUpdateInput = {
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

type RecruiterProfileUpdateInput = {
  companyName?: string | null;
  companyWebsite?: string | null;
  designation?: string | null;
  bio?: string | null;
};

type RefreshTokenCreateInput = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

type AuthAuditEventCreateInput = {
  eventType: AuthEventType;
  success: boolean;
  userId?: string;
  email?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: unknown;
};

type UploadCreateInput = {
  userId: string;
  originalName: string;
  fileExtension: string;
  mimeType: string;
  fileSizeBytes: number;
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  cloudinaryResourceType: UploadResourceType;
};

type PrismaMock = {
  user: {
    findUnique(args: {
      where: { id?: string; email?: string };
      include?: { studentProfile?: boolean; recruiterProfile?: boolean };
    }): Promise<
      | (User & {
          studentProfile?: StudentProfile | null;
          recruiterProfile?: RecruiterProfile | null;
        })
      | null
    >;
    create(args: { data: UserCreateInput }): Promise<User>;
  };
  studentProfile: {
    create(args: { data: StudentProfileCreateInput }): Promise<StudentProfile>;
    update(args: {
      where: { userId: string };
      data: StudentProfileUpdateInput;
    }): Promise<StudentProfile>;
  };
  recruiterProfile: {
    create(args: { data: RecruiterProfileCreateInput }): Promise<RecruiterProfile>;
    update(args: {
      where: { userId: string };
      data: RecruiterProfileUpdateInput;
    }): Promise<RecruiterProfile>;
  };
  refreshToken: {
    findUnique(args: {
      where: { id?: string };
      include?: { user?: boolean };
    }): Promise<(RefreshToken & { user?: User }) | null>;
    create(args: { data: RefreshTokenCreateInput }): Promise<RefreshToken>;
    update(args: { where: { id: string }; data: Partial<RefreshToken> }): Promise<RefreshToken>;
    updateMany(args: {
      where: {
        id?: string;
        userId?: string;
        tokenHash?: string;
        revokedAt?: null;
      };
      data: Partial<RefreshToken>;
    }): Promise<{ count: number }>;
  };
  authAuditEvent: {
    create(args: { data: AuthAuditEventCreateInput }): Promise<AuthAuditEventCreateInput & { id: string; createdAt: Date }>;
  };
  upload: {
    findUnique(args: { where: { id: string } }): Promise<Upload | null>;
    create(args: { data: UploadCreateInput }): Promise<Upload>;
    update(args: {
      where: { id: string };
      data: {
        deletedAt?: Date | null;
        cloudinarySecureUrl?: string;
      };
    }): Promise<Upload>;
  };
  $transaction<T>(callback: (tx: PrismaMock) => Promise<T>): Promise<T>;
};

export function createPrismaMock() {
  const state = {
    users: [] as User[],
    studentProfiles: [] as StudentProfile[],
    recruiterProfiles: [] as RecruiterProfile[],
    refreshTokens: [] as RefreshToken[],
    uploads: [] as Upload[],
    authAuditEvents: [] as Array<AuthAuditEventCreateInput & { id: string; createdAt: Date }>,
  };

  const prismaMock: PrismaMock = {
    user: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { id?: string; email?: string };
        include?: { studentProfile?: boolean; recruiterProfile?: boolean };
      }) => {
        const user = state.users.find((item) => item.id === where.id || item.email === where.email);

        if (!user) {
          return null;
        }

        if (!include?.studentProfile && !include?.recruiterProfile) {
          return user;
        }

        return {
          ...user,
          studentProfile:
            include?.studentProfile === true
              ? state.studentProfiles.find((profile) => profile.userId === user.id) ?? null
              : undefined,
          recruiterProfile:
            include?.recruiterProfile === true
              ? state.recruiterProfiles.find((profile) => profile.userId === user.id) ?? null
              : undefined,
        };
      },
      create: async ({ data }: { data: UserCreateInput }) => {
        const user: User = {
          id: randomUUID(),
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: data.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        state.users.push(user);

        return user;
      },
    },
    studentProfile: {
      create: async ({ data }: { data: StudentProfileCreateInput }) => {
        const profile: StudentProfile = {
          userId: data.userId,
          fullName: data.fullName ?? null,
          headline: data.headline ?? null,
          university: data.university ?? null,
          degree: data.degree ?? null,
          graduationYear: data.graduationYear ?? null,
          githubUrl: data.githubUrl ?? null,
          linkedinUrl: data.linkedinUrl ?? null,
          portfolioUrl: data.portfolioUrl ?? null,
          bio: data.bio ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        state.studentProfiles.push(profile);

        return profile;
      },
      update: async ({
        where,
        data,
      }: {
        where: { userId: string };
        data: StudentProfileUpdateInput;
      }) => {
        const index = state.studentProfiles.findIndex((profile) => profile.userId === where.userId);

        if (index === -1) {
          throw new Error('Student profile not found');
        }

        const updated: StudentProfile = {
          ...state.studentProfiles[index]!,
          fullName:
            data.fullName === undefined ? state.studentProfiles[index]!.fullName : data.fullName,
          headline:
            data.headline === undefined ? state.studentProfiles[index]!.headline : data.headline,
          university:
            data.university === undefined
              ? state.studentProfiles[index]!.university
              : data.university,
          degree: data.degree === undefined ? state.studentProfiles[index]!.degree : data.degree,
          graduationYear:
            data.graduationYear === undefined
              ? state.studentProfiles[index]!.graduationYear
              : data.graduationYear,
          githubUrl:
            data.githubUrl === undefined
              ? state.studentProfiles[index]!.githubUrl
              : data.githubUrl,
          linkedinUrl:
            data.linkedinUrl === undefined
              ? state.studentProfiles[index]!.linkedinUrl
              : data.linkedinUrl,
          portfolioUrl:
            data.portfolioUrl === undefined
              ? state.studentProfiles[index]!.portfolioUrl
              : data.portfolioUrl,
          bio: data.bio === undefined ? state.studentProfiles[index]!.bio : data.bio,
          updatedAt: new Date(),
        };

        state.studentProfiles[index] = updated;

        return updated;
      },
    },
    recruiterProfile: {
      create: async ({ data }: { data: RecruiterProfileCreateInput }) => {
        const profile: RecruiterProfile = {
          userId: data.userId,
          companyName: data.companyName ?? null,
          companyWebsite: data.companyWebsite ?? null,
          designation: data.designation ?? null,
          bio: data.bio ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        state.recruiterProfiles.push(profile);

        return profile;
      },
      update: async ({
        where,
        data,
      }: {
        where: { userId: string };
        data: RecruiterProfileUpdateInput;
      }) => {
        const index = state.recruiterProfiles.findIndex(
          (profile) => profile.userId === where.userId,
        );

        if (index === -1) {
          throw new Error('Recruiter profile not found');
        }

        const updated: RecruiterProfile = {
          ...state.recruiterProfiles[index]!,
          companyName:
            data.companyName === undefined
              ? state.recruiterProfiles[index]!.companyName
              : data.companyName,
          companyWebsite:
            data.companyWebsite === undefined
              ? state.recruiterProfiles[index]!.companyWebsite
              : data.companyWebsite,
          designation:
            data.designation === undefined
              ? state.recruiterProfiles[index]!.designation
              : data.designation,
          bio: data.bio === undefined ? state.recruiterProfiles[index]!.bio : data.bio,
          updatedAt: new Date(),
        };

        state.recruiterProfiles[index] = updated;

        return updated;
      },
    },
    refreshToken: {
      findUnique: async ({
        where,
        include,
      }: {
        where: { id?: string };
        include?: { user?: boolean };
      }) => {
        const refreshToken = state.refreshTokens.find((token) => token.id === where.id) ?? null;

        if (!refreshToken) {
          return null;
        }

        if (include?.user) {
          const user = state.users.find((item) => item.id === refreshToken.userId);

          if (!user) {
            return null;
          }

          return {
            ...refreshToken,
            user,
          };
        }

        return refreshToken;
      },
      create: async ({ data }: { data: RefreshTokenCreateInput }) => {
        const refreshToken: RefreshToken = {
          id: data.id,
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          createdAt: new Date(),
          revokedAt: null,
        };

        state.refreshTokens.push(refreshToken);

        return refreshToken;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<RefreshToken>;
      }) => {
        const index = state.refreshTokens.findIndex((token) => token.id === where.id);

        if (index === -1) {
          throw new Error('Refresh token not found');
        }

        const updated = {
          id: data.id ?? state.refreshTokens[index]!.id,
          userId: data.userId ?? state.refreshTokens[index]!.userId,
          tokenHash: data.tokenHash ?? state.refreshTokens[index]!.tokenHash,
          expiresAt: data.expiresAt ?? state.refreshTokens[index]!.expiresAt,
          createdAt: data.createdAt ?? state.refreshTokens[index]!.createdAt,
          revokedAt: data.revokedAt ?? state.refreshTokens[index]!.revokedAt,
        };

        state.refreshTokens[index] = updated;

        return updated;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: {
          id?: string;
          userId?: string;
          tokenHash?: string;
          revokedAt?: null;
        };
        data: Partial<RefreshToken>;
      }) => {
        let count = 0;

        state.refreshTokens = state.refreshTokens.map((token) => {
          const matches =
            (where.id === undefined || token.id === where.id) &&
            (where.userId === undefined || token.userId === where.userId) &&
            (where.tokenHash === undefined || token.tokenHash === where.tokenHash) &&
            (where.revokedAt !== null || token.revokedAt === null);

          if (!matches) {
            return token;
          }

          count += 1;

          return {
            id: data.id ?? token.id,
            userId: data.userId ?? token.userId,
            tokenHash: data.tokenHash ?? token.tokenHash,
            expiresAt: data.expiresAt ?? token.expiresAt,
            createdAt: data.createdAt ?? token.createdAt,
            revokedAt: data.revokedAt ?? token.revokedAt,
          };
        });

        return { count };
      },
    },
    authAuditEvent: {
      create: async ({ data }: { data: AuthAuditEventCreateInput }) => {
        const authAuditEvent = {
          id: randomUUID(),
          createdAt: new Date(),
          ...data,
        };

        state.authAuditEvents.push(authAuditEvent);

        return authAuditEvent;
      },
    },
    upload: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        state.uploads.find((upload) => upload.id === where.id) ?? null,
      create: async ({ data }: { data: UploadCreateInput }) => {
        const upload: Upload = {
          id: randomUUID(),
          userId: data.userId,
          originalName: data.originalName,
          fileExtension: data.fileExtension,
          mimeType: data.mimeType,
          fileSizeBytes: data.fileSizeBytes,
          cloudinaryPublicId: data.cloudinaryPublicId,
          cloudinarySecureUrl: data.cloudinarySecureUrl,
          cloudinaryResourceType: data.cloudinaryResourceType,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        state.uploads.push(upload);

        return upload;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          deletedAt?: Date | null;
          cloudinarySecureUrl?: string;
        };
      }) => {
        const index = state.uploads.findIndex((upload) => upload.id === where.id);

        if (index === -1) {
          throw new Error('Upload not found');
        }

        const updated: Upload = {
          ...state.uploads[index]!,
          deletedAt: data.deletedAt === undefined ? state.uploads[index]!.deletedAt : data.deletedAt,
          cloudinarySecureUrl:
            data.cloudinarySecureUrl === undefined
              ? state.uploads[index]!.cloudinarySecureUrl
              : data.cloudinarySecureUrl,
          updatedAt: new Date(),
        };

        state.uploads[index] = updated;

        return updated;
      },
    },
    $transaction: async <T>(callback: (tx: typeof prismaMock) => Promise<T>) => callback(prismaMock),
  };

  return {
    prismaMock,
    state,
  };
}
