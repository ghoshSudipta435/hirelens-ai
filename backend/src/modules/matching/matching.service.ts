import { type PrismaClient, MatchContextType } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { providers } from '../../config/providers';
import type { MatchInput } from '../../providers/ai/types';
import { addJob } from '../../providers/queue';
import { aiCache, matchCache } from '../../providers/cache/keys';
import { ApiError } from '../../utils/api-error';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';
import type { PreviewMatchInputDto } from './matching.schemas';
import type { MatchListQuery } from './matching.types';

type MatchPrismaClient = Pick<PrismaClient, 'matchResult' | 'resume' | 'jobPosting' | 'application' | '$transaction'>;

const SCORE_VERSION = '1.0.0';

function computeFallbackMatch(
  resumeText: string,
  jobDescription: string,
  jobSkills: string[],
): { score: number; matchedSkills: string[]; missingSkills: string[]; strengths: string[] } {
  const resumeLower = resumeText.toLowerCase();
  const resumeWords = resumeLower.split(/\W+/).filter(Boolean);
  const jobWords = jobDescription.toLowerCase().split(/\W+/).filter(Boolean);

  const resumeWordSet = new Set(resumeWords);
  const matchedWords = jobWords.filter((w) => resumeWordSet.has(w));

  const score = jobWords.length > 0 ? Math.round((matchedWords.length / jobWords.length) * 100) : 0;

  const matchedSkills = jobSkills.filter((s) => resumeLower.includes(s.toLowerCase()));
  const missingSkills = jobSkills.filter((s) => !resumeLower.includes(s.toLowerCase()));

  const strengths = matchedSkills.length > 0 ? [`Matched ${matchedSkills.length} skill${matchedSkills.length > 1 ? 's' : ''}`] : [];

  return { score: Math.min(score, 100), matchedSkills, missingSkills, strengths };
}

export class MatchingService {
  private readonly prismaClient: MatchPrismaClient;

  constructor(dependencies: { prismaClient?: MatchPrismaClient } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
  }

  async previewMatch(userId: string, data: PreviewMatchInputDto) {
    const resume = await this.prismaClient.resume.findUnique({
      where: { id: data.resumeId, deletedAt: null },
      include: { uploadedFile: true },
    });

    if (!resume || resume.ownerId !== userId) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    const job = await this.prismaClient.jobPosting.findUnique({
      where: { id: data.jobPostingId, deletedAt: null },
    });

    if (!job) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'JOB_NOT_FOUND', 'Job posting not found');
    }

    const ai = await providers.getAI();

    const parsedData = (resume as { parsedData?: { rawText?: string; skills?: string[] } | null }).parsedData ?? null;

    let resumeText = parsedData?.rawText ?? '';
    let resumeSkills = parsedData?.skills ?? [];

    if (!resumeText && resume.uploadedFile) {
      try {
        const storage = await providers.getStorage();
        const buffer = await storage.downloadFile({ url: resume.uploadedFile.fileUrl });
        resumeText = buffer.toString('utf-8');
      } catch {
        resumeText = resume.title;
      }
    }

    const matchInput: MatchInput = {
      resumeSkills,
      jobSkills: job.extractedSkills,
      resumeText,
      jobDescription: job.description,
    };

    const cachedScore = await aiCache.getMatchScore(data.resumeId, data.jobPostingId);

    // Generate instant baseline score
    let matchOutput = computeFallbackMatch(resumeText, job.description, job.extractedSkills);

    if (cachedScore) {
      matchOutput = cachedScore as typeof matchOutput;
    }

    const matchResult = await this.prismaClient.matchResult.create({
      data: {
        contextType: MatchContextType.PREVIEW,
        resumeId: data.resumeId,
        jobPostingId: data.jobPostingId,
        score: matchOutput.score,
        matchedSkills: matchOutput.matchedSkills,
        missingSkills: matchOutput.missingSkills,
        strengths: matchOutput.strengths,
        scoreVersion: SCORE_VERSION,
      },
      include: {
        resume: { select: { id: true, title: true } },
        jobPosting: { select: { id: true, title: true } },
      },
    });

    matchCache.set(matchResult.id, matchResult).catch(() => {});
    matchCache.invalidateList(userId).catch(() => {});

    addJob('match-score', {
      matchId: matchResult.id,
      resumeId: data.resumeId,
      jobPostingId: data.jobPostingId,
      ownerId: userId,
    }).then((job) => {
      if (!job) {
        // Fallback to synchronous fire-and-forget if Redis is disabled
        this.enrichMatchWithAi(matchResult.id, matchInput).catch(() => {});
      }
    });

    return matchResult;
  }

  public async enrichMatchWithAi(matchId: string, matchInput: MatchInput): Promise<void> {
    const ai = await providers.getAI();
    try {
      const matchOutput = await ai.generateMatchScore(matchInput);
      
      const updatedMatch = await this.prismaClient.matchResult.update({
        where: { id: matchId },
        data: {
          score: matchOutput.score,
          matchedSkills: matchOutput.matchedSkills,
          missingSkills: matchOutput.missingSkills,
          strengths: matchOutput.strengths,
          scoreVersion: SCORE_VERSION,
        },
      });

      aiCache.setMatchScore(updatedMatch.resumeId, updatedMatch.jobPostingId || '', matchOutput).catch(() => {});
      matchCache.set(matchId, updatedMatch).catch(() => {});
    } catch (error) {
      // Keep baseline score on failure
    }
  }

  async getMatch(matchId: string, userId: string, role: string) {
    const cached = await matchCache.get(matchId);
    if (cached) return cached;

    const match = await this.prismaClient.matchResult.findUnique({
      where: { id: matchId, deletedAt: null },
      include: {
        resume: { select: { id: true, title: true, ownerId: true } },
        jobPosting: { select: { id: true, title: true, recruiterId: true } },
      },
    });

    if (!match) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'MATCH_NOT_FOUND', 'Match result not found');
    }

    if (role === 'STUDENT' && match.resume.ownerId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'Access denied');
    }
    if (role === 'RECRUITER' && match.jobPosting?.recruiterId !== userId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'Access denied');
    }

    matchCache.set(matchId, match).catch(() => {});

    return match;
  }

  async listMatches(userId: string, role: string, query: MatchListQuery) {
    const { page, limit, skip } = parsePagination(query);

    const filterKey = JSON.stringify({ role, ...query });
    const cached = await matchCache.getList(userId, filterKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (query.contextType) {
      where.contextType = query.contextType;
    }
    
    if (query.minScore !== undefined) {
      where.score = { gte: query.minScore };
    }

    const jobPostingWhere: any = { deletedAt: null };

    if (query.company) {
      const matchingProfiles = await prisma.recruiterProfile.findMany({
        where: { companyName: { contains: query.company, mode: 'insensitive' } },
        select: { userId: true },
      });
      const recruiterIds = matchingProfiles.map((p) => p.userId);
      if (recruiterIds.length === 0) {
        return buildPaginatedResponse([], 0, page, limit);
      }
      jobPostingWhere.recruiterId = { in: recruiterIds };
    }
    if (query.locationMode) {
      jobPostingWhere.locationMode = query.locationMode;
    }
    if (query.employmentType) {
      jobPostingWhere.employmentType = query.employmentType;
    }
    if (query.category) {
      jobPostingWhere.category = query.category;
    }
    if (query.experienceYears !== undefined) {
      jobPostingWhere.experienceYears = { lte: query.experienceYears };
    }
    if (query.salaryMin !== undefined) {
      jobPostingWhere.OR = [
        { salaryMax: { gte: query.salaryMin } },
        { salaryMin: { gte: query.salaryMin } }
      ];
    }
    if (query.skills) {
      const skillsArray = query.skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArray.length > 0) {
        jobPostingWhere.extractedSkills = { hasSome: skillsArray };
      }
    }

    if (role === 'STUDENT') {
      where.resume = { ownerId: userId, deletedAt: null };
      where.jobPosting = Object.keys(jobPostingWhere).length > 1 ? jobPostingWhere : { deletedAt: null };
    } else if (role === 'RECRUITER') {
      jobPostingWhere.recruiterId = userId;
      where.jobPosting = jobPostingWhere;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (query.sort) {
      switch (query.sort) {
        case 'score_highest':
          orderBy = { score: 'desc' };
          break;
        case 'score_lowest':
          orderBy = { score: 'asc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'salary':
          orderBy = { jobPosting: { salaryMax: 'desc' } };
          break;
        case 'company':
          orderBy = { jobPosting: { recruiter: { recruiterProfile: { companyName: 'asc' } } } };
          break;
        case 'location':
          orderBy = { jobPosting: { locationMode: 'asc' } };
          break;
      }
    }

    const [items, total] = await Promise.all([
      this.prismaClient.matchResult.findMany({
        where,
        skip,
        take: limit,
        include: {
          resume: { select: { id: true, title: true } },
          jobPosting: { select: { id: true, title: true, description: true, employmentType: true, locationMode: true, salaryMin: true, salaryMax: true, experienceYears: true, category: true, recruiter: { select: { name: true, recruiterProfile: { select: { companyName: true } } } } } },
          questionSets: { select: { id: true } },
        },
        orderBy,
      }),
      this.prismaClient.matchResult.count({ where }),
    ]);

    const result = buildPaginatedResponse(items, total, page, limit);
    matchCache.setList(userId, filterKey, result).catch(() => {});

    return result;
  }

  async queueAutoMatchesForResume(resumeId: string, ownerId: string): Promise<void> {
    const resume = await this.prismaClient.resume.findUnique({
      where: { id: resumeId, deletedAt: null },
    });

    if (!resume || resume.ownerId !== ownerId) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'RESUME_NOT_FOUND', 'Resume not found');
    }

    // Soft delete any existing AUTO_MATCH records for this resume/owner
    await this.prismaClient.matchResult.updateMany({
      where: {
        resume: { ownerId },
        contextType: MatchContextType.AUTO_MATCH,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Invalidate match caches
    matchCache.invalidateList(ownerId).catch(() => {});

    // Queue the background job to generate matches
    addJob('auto-match-generation', {
      resumeId,
      ownerId,
    }).catch(() => {});
  }
}
