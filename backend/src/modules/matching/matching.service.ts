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

    let matchOutput: { score: number; matchedSkills: string[]; missingSkills: string[]; strengths: string[] };

    try {
      matchOutput = await ai.generateMatchScore(matchInput);
    } catch {
      matchOutput = computeFallbackMatch(resumeText, job.description, job.extractedSkills);
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
