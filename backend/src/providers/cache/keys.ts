import { cacheGet, cacheSet, cacheDelete, cacheDeletePattern } from './index';

const JOB_PREFIX = 'jobs';
const MATCH_PREFIX = 'matches';
const AI_PREFIX = 'ai';
const USER_PREFIX = 'users';

const JOB_TTL = 600; // 10 minutes
const MATCH_TTL = 300; // 5 minutes
const AI_TTL = 3600; // 1 hour
const USER_TTL = 1800; // 30 minutes

export const cacheKeys = {
  jobById: (id: string) => `job:${id}`,
  jobList: (filters: string) => `jobs:list:${filters}`,
  jobRecruiterList: (recruiterId: string, filters: string) => `jobs:recruiter:${recruiterId}:${filters}`,

  matchById: (id: string) => `match:${id}`,
  matchByResumeAndJob: (resumeId: string, jobPostingId: string) => `match:${resumeId}:${jobPostingId}`,
  matchList: (userId: string, filters: string) => `matches:${userId}:${filters}`,

  resumeAnalysis: (resumeId: string) => `ai:resume:${resumeId}`,
  interviewQuestions: (matchId: string) => `ai:interview:${matchId}`,
  matchScore: (resumeId: string, jobPostingId: string) => `ai:match:${resumeId}:${jobPostingId}`,

  userProfile: (userId: string) => `user:profile:${userId}`,
  userDashboard: (userId: string) => `user:dashboard:${userId}`,
};

export const jobCache = {
  async get(id: string) {
    return cacheGet<unknown>(cacheKeys.jobById(id), { prefix: JOB_PREFIX, ttlSeconds: JOB_TTL });
  },
  async set(id: string, data: unknown) {
    return cacheSet(cacheKeys.jobById(id), data, { prefix: JOB_PREFIX, ttlSeconds: JOB_TTL });
  },
  async invalidate(id: string) {
    await cacheDelete(cacheKeys.jobById(id), { prefix: JOB_PREFIX });
    await cacheDeletePattern(`job:*`, { prefix: JOB_PREFIX });
  },
  async invalidateList() {
    await cacheDeletePattern(`jobs:*`, { prefix: JOB_PREFIX });
  },
};

export const matchCache = {
  async get(id: string) {
    return cacheGet<unknown>(cacheKeys.matchById(id), { prefix: MATCH_PREFIX, ttlSeconds: MATCH_TTL });
  },
  async set(id: string, data: unknown) {
    return cacheSet(cacheKeys.matchById(id), data, { prefix: MATCH_PREFIX, ttlSeconds: MATCH_TTL });
  },
  async getByResumeAndJob(resumeId: string, jobPostingId: string) {
    return cacheGet<unknown>(
      cacheKeys.matchByResumeAndJob(resumeId, jobPostingId),
      { prefix: MATCH_PREFIX, ttlSeconds: MATCH_TTL }
    );
  },
  async setByResumeAndJob(resumeId: string, jobPostingId: string, data: unknown) {
    return cacheSet(
      cacheKeys.matchByResumeAndJob(resumeId, jobPostingId),
      data,
      { prefix: MATCH_PREFIX, ttlSeconds: MATCH_TTL }
    );
  },
  async invalidateList(userId: string) {
    await cacheDeletePattern(`matches:${userId}:*`, { prefix: MATCH_PREFIX });
  },
};

export const aiCache = {
  async getResumeAnalysis(resumeId: string) {
    return cacheGet<unknown>(cacheKeys.resumeAnalysis(resumeId), { prefix: AI_PREFIX, ttlSeconds: AI_TTL });
  },
  async setResumeAnalysis(resumeId: string, data: unknown) {
    return cacheSet(cacheKeys.resumeAnalysis(resumeId), data, { prefix: AI_PREFIX, ttlSeconds: AI_TTL });
  },
  async getInterviewQuestions(matchId: string) {
    return cacheGet<unknown>(cacheKeys.interviewQuestions(matchId), { prefix: AI_PREFIX, ttlSeconds: AI_TTL });
  },
  async setInterviewQuestions(matchId: string, data: unknown) {
    return cacheSet(cacheKeys.interviewQuestions(matchId), data, { prefix: AI_PREFIX, ttlSeconds: AI_TTL });
  },
  async getMatchScore(resumeId: string, jobPostingId: string) {
    return cacheGet<unknown>(cacheKeys.matchScore(resumeId, jobPostingId), { prefix: AI_PREFIX, ttlSeconds: AI_TTL });
  },
  async setMatchScore(resumeId: string, jobPostingId: string, data: unknown) {
    return cacheSet(cacheKeys.matchScore(resumeId, jobPostingId), data, { prefix: AI_PREFIX, ttlSeconds: AI_TTL });
  },
  async invalidateAll() {
    await cacheDeletePattern(`ai:*`, { prefix: AI_PREFIX });
  },
};

export const userCache = {
  async getProfile(userId: string) {
    return cacheGet<unknown>(cacheKeys.userProfile(userId), { prefix: USER_PREFIX, ttlSeconds: USER_TTL });
  },
  async setProfile(userId: string, data: unknown) {
    return cacheSet(cacheKeys.userProfile(userId), data, { prefix: USER_PREFIX, ttlSeconds: USER_TTL });
  },
  async invalidateProfile(userId: string) {
    await cacheDelete(cacheKeys.userProfile(userId), { prefix: USER_PREFIX });
  },
};
