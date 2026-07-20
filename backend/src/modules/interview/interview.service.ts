import { type PrismaClient, QuestionDifficulty } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { logger } from '../../config/logger';
import { prisma } from '../../config/prisma';
import { providers } from '../../config/providers';
import { matchCache } from '../../providers/cache/keys';
import type { InterviewQuestionInput } from '../../providers/ai/types';
import { addJob } from '../../providers/queue';
import { ApiError } from '../../utils/api-error';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';

type InterviewPrismaClient = Pick<PrismaClient, 'interviewQuestionSet' | 'interviewQuestion' | 'matchResult' | 'jobPosting' | 'resume' | '$transaction'>;

export class InterviewService {
  private readonly prismaClient: InterviewPrismaClient;

  constructor(dependencies: { prismaClient?: InterviewPrismaClient } = {}) {
    this.prismaClient = dependencies.prismaClient ?? prisma;
  }

  async generateQuestions(recruiterId: string, matchResultId: string) {
    const match = await this.prismaClient.matchResult.findUnique({
      where: { id: matchResultId },
      include: {
        jobPosting: { select: { recruiterId: true, title: true, description: true } },
        resume: { select: { ownerId: true } },
      },
    });

    if (!match) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'MATCH_NOT_FOUND', 'Match result not found');
    }

    if (match.jobPosting?.recruiterId !== recruiterId) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You can only generate questions for your own job postings');
    }

    const existingSet = await this.prismaClient.interviewQuestionSet.findFirst({
      where: { matchResultId },
      include: { questions: true },
    });

    if (existingSet && existingSet.questions.length > 0) {
      return existingSet;
    }

    const job = await addJob('interview-generate', { matchResultId, recruiterId });
    if (job) {
      return this.prismaClient.interviewQuestionSet.create({
        data: { matchResultId },
      });
    }

    const aiInput: InterviewQuestionInput = {
      jobTitle: match.jobPosting?.title ?? 'Unknown',
      jobDescription: match.jobPosting?.description ?? '',
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      strengths: match.strengths,
    };

    const ai = await providers.getAI();
    let questions: { question: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; category: string }[];

    try {
      const output = await ai.generateInterviewQuestions(aiInput);
      questions = output.questions || [];
    } catch (err) {
      logger.error({ err }, 'AI question generation failed');
      questions = [];
    }

    if (!questions || questions.length === 0) {
      questions = [
        {
          question: 'Can you describe your experience and how it relates to this role?',
          difficulty: 'EASY',
          category: 'General',
        },
        {
          question: 'What do you consider your greatest professional strength?',
          difficulty: 'MEDIUM',
          category: 'General',
        },
        {
          question: 'Describe a challenging project you worked on and how you overcame obstacles.',
          difficulty: 'HARD',
          category: 'Behavioral',
        },
      ];
    }

    const questionSet = await this.prismaClient.interviewQuestionSet.create({
      data: {
        matchResultId,
        questions: {
          create: questions.map((q) => ({
            question: q.question,
            difficulty: q.difficulty as QuestionDifficulty,
            category: q.category,
          })),
        },
      },
      include: { questions: true },
    });

    if (match.jobPosting?.recruiterId) {
      matchCache.invalidateList(match.jobPosting.recruiterId).catch(() => {});
    }
    if (match.resume?.ownerId) {
      matchCache.invalidateList(match.resume.ownerId).catch(() => {});
    }

    try {
      providers.getEmail().then((email) => {
        if (!email) return;
        prisma.user.findUnique({ where: { id: recruiterId }, select: { name: true, email: true } }).then((user) => {
          if (user?.email) {
            email.send('resume-analyzed', user.email, {
              name: user.name,
              resumeTitle: `Interview questions for ${match.jobPosting?.title ?? 'job'}`,
              skillsCount: String(questionSet.questions.length),
            }).catch((err) => {
              logger.warn({ err, matchResultId }, 'Interview generation notification email failed');
            });
          }
        });
      }).catch(() => {});
    } catch {
      // Email is best-effort
    }

    return questionSet;
  }

  async getQuestionSet(userId: string, questionSetId: string) {
    const questionSet = await this.prismaClient.interviewQuestionSet.findUnique({
      where: { id: questionSetId },
      include: {
        questions: true,
        matchResult: {
          include: {
            jobPosting: { select: { recruiterId: true } },
            resume: { select: { ownerId: true } },
          },
        },
      },
    });

    if (!questionSet) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'QUESTION_SET_NOT_FOUND', 'Question set not found');
    }

    const matchResult = questionSet.matchResult;
    const isOwner = matchResult?.jobPosting?.recruiterId === userId;
    const isCandidate = matchResult?.resume?.ownerId === userId;

    if (!isOwner && !isCandidate) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'FORBIDDEN', 'You do not have access to this question set');
    }

    const { matchResult: _, ...safeQuestionSet } = questionSet;
    return safeQuestionSet;
  }

  async listQuestionSets(userId: string, role: string, query: { page?: number; limit?: number }) {
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = {};

    if (role === 'STUDENT') {
      where.matchResult = { resume: { ownerId: userId } };
    } else if (role === 'RECRUITER') {
      where.matchResult = { jobPosting: { recruiterId: userId } };
    }

    const [items, total] = await Promise.all([
      this.prismaClient.interviewQuestionSet.findMany({
        where,
        skip,
        take: limit,
        include: {
          questions: { select: { id: true, question: true, difficulty: true, category: true } },
          matchResult: {
            select: {
              id: true,
              score: true,
              resume: { select: { id: true, title: true } },
              jobPosting: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaClient.interviewQuestionSet.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, limit);
  }
}
