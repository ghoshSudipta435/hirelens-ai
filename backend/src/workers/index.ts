import type { Job } from 'bullmq';
import { logger } from '../config/logger';
import { providers } from '../config/providers';
import { addJob } from '../providers/queue';

interface ResumeParseJobData {
  resumeId: string;
  ownerId: string;
}

interface MatchScoreJobData {
  matchId: string;
  resumeId: string;
  jobPostingId: string;
  ownerId: string;
}

interface InterviewGenerateJobData {
  matchResultId: string;
  recruiterId: string;
}

export async function processResumeParse(job: Job<ResumeParseJobData>): Promise<void> {
  const { resumeId } = job.data;
  logger.info({ resumeId, jobId: job.id }, 'Processing resume parse job');

  try {
    const { cloudinaryStorage } = await import('../providers/storage/cloudinary.storage');
    const { prisma } = await import('../config/prisma');
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: { uploadedFile: true },
    });

    if (!resume) {
      logger.warn({ resumeId }, 'Resume not found, skipping parse job');
      return;
    }

    if (!resume.uploadedFile) {
      logger.warn({ resumeId }, 'No uploaded file associated with resume, skipping parse job');
      return;
    }

    const parser = await providers.getParser();
    const fileBuffer = await cloudinaryStorage.downloadFile({ url: resume.uploadedFile.fileUrl });
    const mimeType = resume.uploadedFile.fileType;
    const parsed = await parser.parse(fileBuffer, mimeType);

    if (parsed.rawText.length > 0) {
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          parsedData: {
            rawText: parsed.rawText,
            skills: parsed.skills,
            experience: parsed.experience,
            education: parsed.education,
            summary: parsed.summary,
          },
        },
      });
    }

    logger.info({ resumeId, jobId: job.id }, 'Resume parse job completed');
  } catch (error) {
    logger.error({ err: error, resumeId, jobId: job.id }, 'Resume parse job failed');
    throw error;
  }
}

export async function processMatchScore(job: Job<MatchScoreJobData>): Promise<void> {
  const { matchId, resumeId, jobPostingId } = job.data;
  logger.info({ matchId, jobId: job.id }, 'Processing match score job');

  try {
    const { prisma } = await import('../config/prisma');
    const ai = await providers.getAI();

    const [resume, jobPosting] = await Promise.all([
      prisma.resume.findUnique({ where: { id: resumeId } }),
      prisma.jobPosting.findUnique({ where: { id: jobPostingId } }),
    ]);

    if (!resume || !jobPosting) {
      logger.warn({ matchId }, 'Resume or job posting not found, skipping match');
      return;
    }

    const parsedData = (resume as unknown as { parsedData?: { rawText?: string; skills?: string[] } | null }).parsedData ?? null;

    const result = await ai.generateMatchScore({
      resumeSkills: parsedData?.skills ?? [],
      jobSkills: jobPosting.extractedSkills,
      resumeText: parsedData?.rawText ?? '',
      jobDescription: jobPosting.description,
    });

    await prisma.matchResult.update({
      where: { id: matchId },
      data: {
        score: result.score,
        matchedSkills: result.matchedSkills,
        missingSkills: result.missingSkills,
        strengths: result.strengths,
      },
    });

    logger.info({ matchId, score: result.score, jobId: job.id }, 'Match score job completed');
  } catch (error) {
    logger.error({ err: error, matchId, jobId: job.id }, 'Match score job failed');
    throw error;
  }
}

export async function processInterviewGeneration(job: Job<InterviewGenerateJobData>): Promise<void> {
  const { matchResultId } = job.data;
  logger.info({ matchResultId, jobId: job.id }, 'Processing interview generation job');

  try {
    const { prisma } = await import('../config/prisma');
    const ai = await providers.getAI();

    const match = await prisma.matchResult.findUnique({
      where: { id: matchResultId },
      include: {
        resume: true,
        jobPosting: true,
      },
    });

    if (!match || !match.resume || !match.jobPosting) {
      logger.warn({ matchResultId }, 'Match result or related data not found');
      return;
    }

    const _resume = match.resume as unknown as { parsedData?: { rawText?: string } | null };
    const jobPosting = match.jobPosting as unknown as { description: string; title: string };

    const result = await ai.generateInterviewQuestions({
      jobTitle: jobPosting.title,
      jobDescription: jobPosting.description,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      strengths: match.strengths,
    });

    let questionSet = await prisma.interviewQuestionSet.findFirst({ where: { matchResultId } });
    if (!questionSet) {
      questionSet = await prisma.interviewQuestionSet.create({
        data: { matchResultId },
      });
    }

    await prisma.interviewQuestion.deleteMany({ where: { questionSetId: questionSet.id } });

    const createdQuestions = await prisma.interviewQuestion.createMany({
      data: result.questions.map((q) => ({
        questionSetId: questionSet.id,
        question: q.question,
        difficulty: q.difficulty,
        category: q.category,
      })),
    });

    logger.info({ matchResultId, count: createdQuestions.count, jobId: job.id }, 'Interview generation job completed');
  } catch (error) {
    logger.error({ err: error, matchResultId, jobId: job.id }, 'Interview generation job failed');
    throw error;
  }
}

export async function stopWorkers(): Promise<void> {
  const { getQueueManager } = await import('../providers/queue');
  const manager = await getQueueManager();
  if (!manager) return;
  await manager.close();
  logger.info('Background workers stopped');
}

export async function startWorkers(): Promise<void> {
  const { getQueueManager } = await import('../providers/queue');
  const manager = await getQueueManager();
  if (!manager) {
    logger.warn('Redis not configured, background workers not started');
    return;
  }

  manager.getWorker('resume-parse', processResumeParse, { concurrency: 2 });
  manager.getWorker('match-score', processMatchScore, { concurrency: 2 });
  manager.getWorker('interview-generate', processInterviewGeneration, { concurrency: 1 });

  logger.info('Background workers started');
}

export { addJob };
