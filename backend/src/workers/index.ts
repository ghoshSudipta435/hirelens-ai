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

interface AutoMatchJobData {
  resumeId: string;
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

    const { ResumeService } = await import('../modules/resumes/resumes.service');
    const resumeService = new ResumeService({ prismaClient: prisma });
    await resumeService.enrichResumeWithAi(resumeId);

    const { broadcastEvent } = await import('../routes/sse.route');
    broadcastEvent(job.data.ownerId, 'RESUME_PARSED', { resumeId });

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

    const { MatchingService } = await import('../modules/matching/matching.service');
    const matchingService = new MatchingService({ prismaClient: prisma });

    const parsedData = (resume as any).parsedData || {};

    await matchingService.enrichMatchWithAi(matchId, {
      resumeSkills: parsedData.skills ?? [],
      jobSkills: jobPosting.extractedSkills,
      resumeText: parsedData.rawText ?? '',
      jobDescription: jobPosting.description,
    });

    const { broadcastEvent } = await import('../routes/sse.route');
    broadcastEvent(job.data.ownerId, 'MATCH_SCORED', { matchId, resumeId, jobPostingId });

    logger.info({ matchId, jobId: job.id }, 'Match score job completed');
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

    let questions: Array<{ question: string; difficulty: any; category: string }> = [];
    try {
      const result = await ai.generateInterviewQuestions({
        jobTitle: jobPosting.title,
        jobDescription: jobPosting.description,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        strengths: match.strengths,
      });
      questions = result.questions || [];
    } catch (err) {
      logger.error({ err, matchResultId }, 'AI question generation failed in worker');
    }

    if (questions.length === 0) {
      const mainSkill = match.matchedSkills?.[0] || 'the core technologies';
      const missingSkill = match.missingSkills?.[0] || 'certain requirements';
      const roleName = jobPosting.title || 'this role';

      questions = [
        {
          question: `Can you walk us through your experience with ${mainSkill} and how you would apply it as a ${roleName}?`,
          difficulty: 'EASY',
          category: 'Technical',
        },
        {
          question: `This role requires proficiency in ${missingSkill}. How would you approach getting up to speed with this quickly?`,
          difficulty: 'MEDIUM',
          category: 'Adaptability',
        },
        {
          question: `Describe a complex technical challenge you solved recently that prepares you for the specific demands of a ${roleName}.`,
          difficulty: 'HARD',
          category: 'Problem Solving',
        },
      ];
    }

    let questionSet = await prisma.interviewQuestionSet.findFirst({ where: { matchResultId } });
    if (!questionSet) {
      questionSet = await prisma.interviewQuestionSet.create({
        data: { matchResultId },
      });
    }

    await prisma.interviewQuestion.deleteMany({ where: { questionSetId: questionSet.id } });

    const createdQuestions = await prisma.interviewQuestion.createMany({
      data: questions.map((q) => ({
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

export async function processAutoMatchGeneration(job: Job<AutoMatchJobData>): Promise<void> {
  const { resumeId, ownerId } = job.data;
  logger.info({ resumeId, jobId: job.id }, 'Processing auto match generation job');

  try {
    const { prisma } = await import('../config/prisma');
    const ai = await providers.getAI();
    const { broadcastEvent } = await import('../routes/sse.route');

    const resume = await prisma.resume.findUnique({ where: { id: resumeId, deletedAt: null } });
    if (!resume) {
      logger.warn({ resumeId }, 'Resume not found, skipping auto match');
      return;
    }

    const activeJobs = await prisma.jobPosting.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
    });

    if (activeJobs.length === 0) return;

    const parsedData = (resume as any).parsedData || {};
    const resumeText = parsedData.rawText ?? '';
    const resumeSkills = parsedData.skills ?? [];

    let completed = 0;
    const total = activeJobs.length;

    for (const jobPosting of activeJobs) {
      let matchResultId = '';
      try {
        const pendingMatch = await prisma.matchResult.create({
          data: {
            contextType: 'AUTO_MATCH',
            status: 'PENDING',
            resumeId,
            jobPostingId: jobPosting.id,
            score: 0,
            matchedSkills: [],
            missingSkills: [],
            strengths: [],
            scoreVersion: '1.0.0',
          },
        });
        matchResultId = pendingMatch.id;

        const matchInput = {
          resumeSkills,
          jobSkills: jobPosting.extractedSkills,
          resumeText,
          jobDescription: jobPosting.description,
        };

        let matchOutput: { score: number; matchedSkills: string[]; missingSkills: string[]; strengths: string[] };
        try {
          matchOutput = await ai.generateMatchScore(matchInput);
        } catch {
          // Fallback logic
          const resumeLower = matchInput.resumeText.toLowerCase();
          const matchedSkills = matchInput.jobSkills.filter((s) => resumeLower.includes(s.toLowerCase()));
          const missingSkills = matchInput.jobSkills.filter((s) => !resumeLower.includes(s.toLowerCase()));
          const score = matchInput.jobSkills.length > 0 ? Math.round((matchedSkills.length / matchInput.jobSkills.length) * 100) : 0;
          matchOutput = { score: Math.min(score, 100), matchedSkills, missingSkills, strengths: matchedSkills.length > 0 ? [`Matched ${matchedSkills.length} skills`] : [] };
        }

        await prisma.matchResult.update({
          where: { id: matchResultId },
          data: {
            status: 'COMPLETED',
            score: matchOutput.score,
            matchedSkills: matchOutput.matchedSkills,
            missingSkills: matchOutput.missingSkills,
            strengths: matchOutput.strengths,
          },
        });
      } catch (err) {
        logger.error({ err, matchResultId, jobPostingId: jobPosting.id }, 'Failed to auto-match job posting');
        if (matchResultId) {
          await prisma.matchResult.update({
            where: { id: matchResultId },
            data: { status: 'FAILED' },
          }).catch(() => {});
        }
      }

      completed++;
      broadcastEvent(ownerId, 'AUTO_MATCH_PROGRESS', { completed, total });
    }

    broadcastEvent(ownerId, 'AUTO_MATCH_COMPLETED', { total });
    logger.info({ resumeId, jobId: job.id, total }, 'Auto match generation job completed');
  } catch (error) {
    logger.error({ err: error, resumeId, jobId: job.id }, 'Auto match generation job failed');
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
  manager.getWorker('auto-match-generation', processAutoMatchGeneration, { concurrency: 1 });

  const { startAuditWorker } = await import('./audit.worker');
  startAuditWorker();

  logger.info('Background workers started');
}

export { addJob };
