import { type PrismaClient, QuestionDifficulty } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { prisma } from '../../config/prisma';
import { providers } from '../../config/providers';
import type { InterviewQuestionInput } from '../../providers/ai/types';
import { ApiError } from '../../utils/api-error';

type InterviewPrismaClient = Pick<PrismaClient, 'interviewQuestionSet' | 'interviewQuestion' | 'matchResult' | 'jobPosting' | '$transaction'>;

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
      questions = output.questions;
    } catch {
      questions = [];
    }

    if (questions.length === 0) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'QUESTION_GEN_FAILED', 'Failed to generate interview questions');
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
}
