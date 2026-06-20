const fs = require('fs');

const content = `/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'node:crypto';

export function createPrismaMock() {
  const state = {
    users: [] as any[],
    studentProfiles: [] as any[],
    recruiterProfiles: [] as any[],
    refreshTokens: [] as any[],
    uploads: [] as any[],
    authAuditEvents: [] as any[],
    uploadAuditEvents: [] as any[],
    resumes: [] as any[],
    resumeAuditEvents: [] as any[],
  };

  const prismaMock: any = {
    user: {
      findUnique: async ({ where, include }: any) => {
        const user = state.users.find((item) => item.id === where.id || item.email === where.email);
        if (!user) return null;
        if (!include?.studentProfile && !include?.recruiterProfile) return user;
        return {
          ...user,
          studentProfile: include?.studentProfile ? state.studentProfiles.find((profile) => profile.userId === user.id) ?? null : undefined,
          recruiterProfile: include?.recruiterProfile ? state.recruiterProfiles.find((profile) => profile.userId === user.id) ?? null : undefined,
        };
      },
      create: async ({ data }: any) => {
        const user = { id: randomUUID(), createdAt: new Date(), updatedAt: new Date(), ...data };
        state.users.push(user);
        return user;
      },
    },
    studentProfile: {
      create: async ({ data }: any) => {
        const profile = { createdAt: new Date(), updatedAt: new Date(), ...data };
        state.studentProfiles.push(profile);
        return profile;
      },
      update: async ({ where, data }: any) => {
        const index = state.studentProfiles.findIndex((profile) => profile.userId === where.userId);
        if (index === -1) throw new Error('Not found');
        const updated = { ...state.studentProfiles[index], ...data, updatedAt: new Date() };
        state.studentProfiles[index] = updated;
        return updated;
      },
    },
    recruiterProfile: {
      create: async ({ data }: any) => {
        const profile = { createdAt: new Date(), updatedAt: new Date(), ...data };
        state.recruiterProfiles.push(profile);
        return profile;
      },
      update: async ({ where, data }: any) => {
        const index = state.recruiterProfiles.findIndex((profile) => profile.userId === where.userId);
        if (index === -1) throw new Error('Not found');
        const updated = { ...state.recruiterProfiles[index], ...data, updatedAt: new Date() };
        state.recruiterProfiles[index] = updated;
        return updated;
      },
    },
    refreshToken: {
      findUnique: async ({ where, include }: any) => {
        const refreshToken = state.refreshTokens.find((token) => token.id === where.id) ?? null;
        if (!refreshToken) return null;
        if (include?.user) {
          const user = state.users.find((item) => item.id === refreshToken.userId);
          if (!user) return null;
          return { ...refreshToken, user };
        }
        return refreshToken;
      },
      create: async ({ data }: any) => {
        const refreshToken = { createdAt: new Date(), revokedAt: null, ...data };
        state.refreshTokens.push(refreshToken);
        return refreshToken;
      },
      update: async ({ where, data }: any) => {
        const index = state.refreshTokens.findIndex((token) => token.id === where.id);
        if (index === -1) throw new Error('Not found');
        const updated = { ...state.refreshTokens[index], ...data };
        state.refreshTokens[index] = updated;
        return updated;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        state.refreshTokens = state.refreshTokens.map((token) => {
          const matches =
            (where.id === undefined || token.id === where.id) &&
            (where.userId === undefined || token.userId === where.userId) &&
            (where.tokenHash === undefined || token.tokenHash === where.tokenHash) &&
            (where.revokedAt !== null || token.revokedAt === null);
          if (!matches) return token;
          count += 1;
          return { ...token, ...data };
        });
        return { count };
      },
    },
    authAuditEvent: {
      create: async ({ data }: any) => {
        const event = { id: randomUUID(), createdAt: new Date(), ...data };
        state.authAuditEvents.push(event);
        return event;
      },
    },
    uploadedFile: {
      findUnique: async ({ where }: any) => state.uploads.find((upload) => upload.id === where.id) ?? null,
      findMany: async ({ where }: any) => {
        return state.uploads
          .filter((upload) => upload.ownerId === where.ownerId && upload.deletedAt === null)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
      create: async ({ data }: any) => {
        const upload = { id: randomUUID(), createdAt: new Date(), deletedAt: null, ...data };
        state.uploads.push(upload);
        return upload;
      },
      update: async ({ where, data }: any) => {
        const index = state.uploads.findIndex((upload) => upload.id === where.id);
        if (index === -1) throw new Error('Upload not found');
        const updated = { ...state.uploads[index], ...data };
        state.uploads[index] = updated;
        return updated;
      },
    },
    uploadAuditEvent: {
      create: async ({ data }: any) => {
        const event = { id: randomUUID(), createdAt: new Date(), ...data };
        state.uploadAuditEvents.push(event);
        return event;
      },
    },
    resume: {
      findUnique: async ({ where }: any) => {
        if (where.id) return state.resumes.find((r: any) => r.id === where.id) || null;
        if (where.uploadedFileId) return state.resumes.find((r: any) => r.uploadedFileId === where.uploadedFileId) || null;
        return null;
      },
      findFirst: async ({ where }: any) => {
        return state.resumes.find((r: any) => 
          (!where.ownerId || r.ownerId === where.ownerId) &&
          (!where.title || r.title === where.title) &&
          (!where.status || r.status === where.status) &&
          (where.deletedAt === undefined || r.deletedAt === where.deletedAt) &&
          (!where.NOT || r.id !== where.NOT.id)
        ) || null;
      },
      findMany: async ({ where }: any) => {
        return state.resumes.filter((r: any) => 
          (!where.ownerId || r.ownerId === where.ownerId) &&
          (where.deletedAt === undefined || r.deletedAt === where.deletedAt)
        ).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
      },
      create: async ({ data }: any) => {
        const resume = {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          ...data
        };
        state.resumes.push(resume);
        return resume;
      },
      update: async ({ where, data }: any) => {
        const idx = state.resumes.findIndex((r: any) => r.id === where.id);
        if (idx === -1) throw new Error('Not found');
        const updated = { ...state.resumes[idx], ...data, updatedAt: new Date() };
        state.resumes[idx] = updated;
        return updated;
      }
    },
    resumeAuditEvent: {
      create: async ({ data }: any) => {
        const event = { id: randomUUID(), createdAt: new Date(), ...data };
        state.resumeAuditEvents.push(event);
        return event;
      }
    },
    $transaction: async (callback: any) => callback(prismaMock),
  };

  return { prismaMock, state };
}
`;
fs.writeFileSync('tests/fixtures/create-prisma-mock.ts', content);

// remove eslint-disable from all test files
const { execSync } = require('child_process');
execSync("for file in tests/integration/*.ts tests/unit/*.ts; do sed -i '' '/^\\/\\* eslint-disable \\*\\/$/d' \"$file\"; done");

// cast in resumes.service.test.ts instead of adding eslint-disable
let test1 = fs.readFileSync('tests/unit/resumes.service.test.ts', 'utf8');
test1 = test1.replace(/const service = new ResumeService\({ prismaClient: prismaMock as any }\);/g, 'const service = new ResumeService({ prismaClient: prismaMock as any });');
fs.writeFileSync('tests/unit/resumes.service.test.ts', test1);

