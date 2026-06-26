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
    jobPostings: [] as any[],
    applications: [] as any[],
    matchResults: [] as any[],
    interviewQuestionSets: [] as any[],
    interviewQuestions: [] as any[],
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
      findMany: async ({ where, skip, take }: any) => {
        let filtered = [...state.users];
        if (where?.role) filtered = filtered.filter((u: any) => u.role === where.role);
        if (where?.OR) {
          filtered = filtered.filter((u: any) =>
            where.OR.some((cond: any) =>
              (cond.name?.contains && u.name.toLowerCase().includes(cond.name.contains.toLowerCase())) ||
              (cond.email?.contains && u.email.toLowerCase().includes(cond.email.contains.toLowerCase()))
            )
          );
        }
        if (skip) filtered = filtered.slice(skip);
        if (take) filtered = filtered.slice(0, take);
        return filtered.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
      },
      count: async ({ where }: any) => {
        let filtered = [...state.users];
        if (where?.role) filtered = filtered.filter((u: any) => u.role === where.role);
        if (where?.OR) {
          filtered = filtered.filter((u: any) =>
            where.OR.some((cond: any) =>
              (cond.name?.contains && u.name.toLowerCase().includes(cond.name.contains.toLowerCase())) ||
              (cond.email?.contains && u.email.toLowerCase().includes(cond.email.contains.toLowerCase()))
            )
          );
        }
        return filtered.length;
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
      findMany: async ({ where, skip, take }: any) => {
        let filtered = state.uploads
          .filter((upload) => upload.ownerId === where.ownerId && upload.deletedAt === null)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (skip) filtered = filtered.slice(skip);
        if (take) filtered = filtered.slice(0, take);
        return filtered;
      },
      count: async ({ where }: any) => {
        return state.uploads.filter((upload) => upload.ownerId === where.ownerId && upload.deletedAt === null).length;
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
        const byId = (item: any) => item.id === where.id;
        const byFile = (item: any) => item.uploadedFileId === where.uploadedFileId;
        const matches = state.resumes.filter(where.id ? byId : where.uploadedFileId ? byFile : () => false);
        return matches.find((r: any) =>
          (where.deletedAt === undefined || r.deletedAt === where.deletedAt)
        ) || null;
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
      findMany: async ({ where, skip, take }: any) => {
        let filtered = state.resumes.filter((r: any) => 
          (!where.ownerId || r.ownerId === where.ownerId) &&
          (where.deletedAt === undefined || r.deletedAt === where.deletedAt)
        ).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
        if (skip) filtered = filtered.slice(skip);
        if (take) filtered = filtered.slice(0, take);
        return filtered;
      },
      count: async ({ where }: any) => {
        return state.resumes.filter((r: any) => 
          (!where.ownerId || r.ownerId === where.ownerId) &&
          (where.deletedAt === undefined || r.deletedAt === where.deletedAt)
        ).length;
      },
      create: async ({ data, include }: any) => {
        const resume = {
          id: randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          ...data
        };
        state.resumes.push(resume);
        if (include?.uploadedFile) {
          const file = state.uploads.find((u: any) => u.id === data.uploadedFileId);
          resume.uploadedFile = file || null;
        }
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
    jobPosting: {
      findUnique: async ({ where }: any) => {
        if (where.id) {
          return state.jobPostings.find((j: any) =>
            j.id === where.id &&
            (where.deletedAt === undefined || j.deletedAt === where.deletedAt)
          ) || null;
        }
        return null;
      },
      findFirst: async ({ where }: any) => {
        return state.jobPostings.find((j: any) =>
          (!where.id || j.id === where.id) &&
          (!where.recruiterId || j.recruiterId === where.recruiterId)
        ) || null;
      },
      findMany: async ({ where, skip, take }: any) => {
        let filtered = [...state.jobPostings];
        if (where?.deletedAt === null) filtered = filtered.filter((j: any) => j.deletedAt === null);
        if (where?.status) filtered = filtered.filter((j: any) => j.status === where.status);
        if (where?.employmentType) filtered = filtered.filter((j: any) => j.employmentType === where.employmentType);
        if (where?.locationMode) filtered = filtered.filter((j: any) => j.locationMode === where.locationMode);
        if (where?.OR) {
          filtered = filtered.filter((j: any) =>
            where.OR.some((cond: any) =>
              (cond.title?.contains && j.title.toLowerCase().includes(cond.title.contains.toLowerCase())) ||
              (cond.description?.contains && j.description.toLowerCase().includes(cond.description.contains.toLowerCase()))
            )
          );
        }
        const total = filtered.length;
        if (skip) filtered = filtered.slice(skip);
        if (take) filtered = filtered.slice(0, take);
        filtered.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
        return filtered.map((j: any) => ({
          ...j,
          recruiter: state.users.find((u: any) => u.id === j.recruiterId) || null,
        }));
      },
      count: async ({ where }: any) => {
        let filtered = [...state.jobPostings];
        if (where?.deletedAt === null) filtered = filtered.filter((j: any) => j.deletedAt === null);
        if (where?.status) filtered = filtered.filter((j: any) => j.status === where.status);
        return filtered.length;
      },
      create: async ({ data }: any) => {
        const job = { id: randomUUID(), createdAt: new Date(), updatedAt: new Date(), deletedAt: null, extractedSkills: [], ...data };
        state.jobPostings.push(job);
        return job;
      },
      update: async ({ where, data }: any) => {
        const idx = state.jobPostings.findIndex((j: any) => j.id === where.id);
        if (idx === -1) throw new Error('Not found');
        const updated = { ...state.jobPostings[idx], ...data, updatedAt: new Date() };
        state.jobPostings[idx] = updated;
        return updated;
      },
    },
    application: {
      findUnique: async ({ where, include }: any) => {
        let app: any = null;
        if (where.id) app = state.applications.find((a: any) => a.id === where.id) || null;
        if (where.resumeId_jobPostingId) {
          app = state.applications.find(
            (a: any) => a.resumeId === where.resumeId_jobPostingId.resumeId && a.jobPostingId === where.resumeId_jobPostingId.jobPostingId
          ) || null;
        }
        if (!app) return null;
        if (include?.jobPosting) {
          app = { ...app, jobPosting: state.jobPostings.find((j: any) => j.id === app.jobPostingId) || null };
        }
        return app;
      },
      findMany: async ({ where, skip, take }: any) => {
        let filtered = [...state.applications];
        if (where?.status) filtered = filtered.filter((a: any) => a.status === where.status);
        if (where?.jobPostingId) filtered = filtered.filter((a: any) => a.jobPostingId === where.jobPostingId);
        if (where?.resume) {
          filtered = filtered.filter((a: any) => {
            const resume = state.resumes.find((r: any) => r.id === a.resumeId);
            return resume && resume.ownerId === where.resume.ownerId;
          });
        }
        if (where?.jobPosting) {
          filtered = filtered.filter((a: any) => {
            const job = state.jobPostings.find((j: any) => j.id === a.jobPostingId);
            return job && job.recruiterId === where.jobPosting.recruiterId;
          });
        }
        const total = filtered.length;
        if (skip) filtered = filtered.slice(skip);
        if (take) filtered = filtered.slice(0, take);
        filtered.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
        return filtered.map((a: any) => ({
          ...a,
          resume: state.resumes.find((r: any) => r.id === a.resumeId) || null,
          jobPosting: state.jobPostings.find((j: any) => j.id === a.jobPostingId) || null,
        }));
      },
      count: async ({ where }: any) => {
        let filtered = [...state.applications];
        if (where?.status) filtered = filtered.filter((a: any) => a.status === where.status);
        if (where?.resume) {
          filtered = filtered.filter((a: any) => {
            const resume = state.resumes.find((r: any) => r.id === a.resumeId);
            return resume && resume.ownerId === where.resume.ownerId;
          });
        }
        if (where?.jobPosting) {
          filtered = filtered.filter((a: any) => {
            const job = state.jobPostings.find((j: any) => j.id === a.jobPostingId);
            return job && job.recruiterId === where.jobPosting.recruiterId;
          });
        }
        return filtered.length;
      },
      create: async ({ data }: any) => {
        const application = { id: randomUUID(), createdAt: new Date(), updatedAt: new Date(), ...data };
        state.applications.push(application);
        return {
          ...application,
          resume: state.resumes.find((r: any) => r.id === data.resumeId) || null,
          jobPosting: state.jobPostings.find((j: any) => j.id === data.jobPostingId) || null,
        };
      },
      update: async ({ where, data }: any) => {
        const idx = state.applications.findIndex((a: any) => a.id === where.id);
        if (idx === -1) throw new Error('Not found');
        const updated = { ...state.applications[idx], ...data, updatedAt: new Date() };
        state.applications[idx] = updated;
        return {
          ...updated,
          resume: state.resumes.find((r: any) => r.id === updated.resumeId) || null,
          jobPosting: state.jobPostings.find((j: any) => j.id === updated.jobPostingId) || null,
        };
      },
    },
    matchResult: {
      findUnique: async ({ where, include }: any) => {
        let match: any = state.matchResults.find((m: any) => m.id === where.id) || null;
        if (!match) return null;
        if (include?.jobPosting) {
          match = { ...match, jobPosting: state.jobPostings.find((j: any) => j.id === match.jobPostingId) || null };
        }
        if (include?.resume) {
          match = { ...match, resume: state.resumes.find((r: any) => r.id === match.resumeId) || null };
        }
        return match;
      },
      findMany: async ({ where, skip, take }: any) => {
        let filtered = [...state.matchResults];
        if (where?.resume) filtered = filtered.filter((m: any) => {
          const resume = state.resumes.find((r: any) => r.id === m.resumeId);
          return resume && resume.ownerId === where.resume.ownerId;
        });
        const total = filtered.length;
        if (skip) filtered = filtered.slice(skip);
        if (take) filtered = filtered.slice(0, take);
        filtered.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
        return filtered.map((m: any) => ({
          ...m,
          resume: state.resumes.find((r: any) => r.id === m.resumeId) || null,
          jobPosting: m.jobPostingId ? state.jobPostings.find((j: any) => j.id === m.jobPostingId) || null : null,
        }));
      },
      count: async ({ where }: any) => {
        let filtered = [...state.matchResults];
        if (where?.resume) filtered = filtered.filter((m: any) => {
          const resume = state.resumes.find((r: any) => r.id === m.resumeId);
          return resume && resume.ownerId === where.resume.ownerId;
        });
        return filtered.length;
      },
      create: async ({ data }: any) => {
        const match = { id: randomUUID(), createdAt: new Date(), ...data };
        state.matchResults.push(match);
        return {
          ...match,
          resume: state.resumes.find((r: any) => r.id === data.resumeId) || null,
          jobPosting: data.jobPostingId ? state.jobPostings.find((j: any) => j.id === data.jobPostingId) || null : null,
        };
      },
    },
    interviewQuestionSet: {
      findUnique: async ({ where, include }: any) => {
        let qs: any = state.interviewQuestionSets.find((qs: any) => qs.id === where.id) || null;
        if (!qs) return null;
        if (include?.questions) {
          qs = { ...qs, questions: state.interviewQuestions.filter((q: any) => q.questionSetId === qs.id) };
        }
        if (include?.matchResult) {
          const match = state.matchResults.find((m: any) => m.id === qs.matchResultId) || null;
          if (match && include.matchResult.include) {
            const enhanced: any = { ...match };
            if (include.matchResult.include.jobPosting) {
              enhanced.jobPosting = state.jobPostings.find((j: any) => j.id === match.jobPostingId) || null;
            }
            if (include.matchResult.include.resume) {
              enhanced.resume = state.resumes.find((r: any) => r.id === match.resumeId) || null;
            }
            qs = { ...qs, matchResult: enhanced };
          } else {
            qs = { ...qs, matchResult: match };
          }
        }
        return qs;
      },
      findFirst: async ({ where, include }: any) => {
        let qs: any = state.interviewQuestionSets.find((qs: any) =>
          (!where.matchResultId || qs.matchResultId === where.matchResultId)
        ) || null;
        if (!qs) return null;
        if (include?.questions) {
          qs = { ...qs, questions: state.interviewQuestions.filter((q: any) => q.questionSetId === qs.id) };
        }
        return qs;
      },
      create: async ({ data }: any) => {
        const qs = { id: randomUUID(), createdAt: new Date(), ...data, questions: [] };
        if (data.questions?.create) {
          qs.questions = data.questions.create.map((q: any) => ({
            id: randomUUID(),
            questionSetId: qs.id,
            createdAt: new Date(),
            ...q,
          }));
          state.interviewQuestions.push(...qs.questions);
        }
        delete qs.questions?.create;
        state.interviewQuestionSets.push(qs);
        return qs;
      },
    },
    interviewQuestion: {
      findMany: async ({ where }: any) => {
        return state.interviewQuestions.filter((q: any) => q.questionSetId === where.questionSetId);
      },
    },
    $transaction: async (callback: any) => callback(prismaMock),
  };

  return { prismaMock, state };
}
