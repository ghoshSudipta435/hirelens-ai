import { type PrismaClient, MatchContextType } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { providers } from '../../config/providers';
import type { MatchInput } from '../../providers/ai/types';
import { ApiError } from '../../utils/api-error';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';
import type { PreviewMatchInputDto } from './matching.schemas';
import type { MatchListQuery } from './matching.types';

type MatchPrismaClient = Pick<PrismaClient, 'matchResult' | 'resume' | 'jobPosting' | 'application' | '$transaction'>;

const SCORE_VERSION = '1.0.0';

export class MatchingService {
  private readonly prismaClient: MatchPrismaClient;

  constructor(dependencies: { prismaClient?: MatchPrismaClient } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
  }

  async previewMatch(userId: string, data: PreviewMatchInputDto) {
    const resume = await this.prismaClient.resume.findUnique({
      where: { id: data.resumeId, deletedAt: null },
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

    const matchInput: MatchInput = {
      resumeSkills: parsedData?.skills ?? [],
      jobSkills: job.extractedSkills,
      resumeText: parsedData?.rawText ?? '',
      jobDescription: job.description,
    };

    let matchOutput: { score: number; matchedSkills: string[]; missingSkills: string[]; strengths: string[] };

    try {
      matchOutput = await ai.generateMatchScore(matchInput);
    } catch {
      matchOutput = {
        score: 0,
        matchedSkills: [],
        missingSkills: job.extractedSkills,
        strengths: [],
      };
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

    return matchResult;
  }

  async getMatch(matchId: string, userId: string, role: string) {
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

    return match;
  }

  async listMatches(userId: string, role: string, query: MatchListQuery) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (role === 'STUDENT') {
      where.resume = { ownerId: userId, deletedAt: null };
    } else if (role === 'RECRUITER') {
      where.jobPosting = { recruiterId: userId, deletedAt: null };
    }

    const [items, total] = await Promise.all([
      this.prismaClient.matchResult.findMany({
        where,
        skip,
        take: limit,
        include: {
          resume: { select: { id: true, title: true } },
          jobPosting: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaClient.matchResult.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }
}
