import type { AIProvider, InterviewQuestionInput, InterviewQuestionOutput, MatchInput, MatchOutput } from '../types';
import { interviewQuestionOutputSchema, matchOutputSchema, skillsOutputSchema } from '../schemas';
import { buildSystemPrompt, wrapUserContent } from '../prompt-builder';
import { withRetry } from '../retry';

type LlamaCppConfig = {
  baseUrl: string;
  model: string;
};

export class LlamaCppProvider implements AIProvider {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: LlamaCppConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.model = config.model;
  }

  private async chatCompletion(messages: { role: string; content: string }[]): Promise<string> {
    const response = await withRetry(async (signal) => {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.3,
          max_tokens: 2048,
          response_format: { type: 'json_object' },
        }),
        signal,
      });

      if (!res.ok) {
        throw new Error(`llama.cpp API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json() as { choices?: { message?: { content?: string } }[] };
      return data.choices?.[0]?.message?.content ?? '{}';
    });

    return response;
  }

  async extractSkillsFromText(text: string): Promise<string[]> {
    const content = await this.chatCompletion([
      {
        role: 'system',
        content: buildSystemPrompt(
          'You are a skill extraction assistant. Extract a list of technical and professional skills from the given text. Return only a JSON object with a "skills" array of strings.',
        ),
      },
      { role: 'user', content: wrapUserContent(text) },
    ]);

    const parsed = skillsOutputSchema.parse(JSON.parse(content));
    return parsed.skills;
  }

  async generateMatchScore(input: MatchInput): Promise<MatchOutput> {
    const content = await this.chatCompletion([
      {
        role: 'system',
        content: buildSystemPrompt(
          `You are a resume-job matching assistant. Analyze the match between a resume and a job description.
Return a JSON object with:
- score: integer 0-100
- matchedSkills: array of skills present in both
- missingSkills: array of skills required by the job but not found in resume
- strengths: array of strong points from the resume relevant to the job`,
        ),
      },
      {
        role: 'user',
        content: wrapUserContent(
          JSON.stringify({
            resumeSkills: input.resumeSkills,
            jobSkills: input.jobSkills,
            resumeText: input.resumeText,
            jobDescription: input.jobDescription,
          }),
        ),
      },
    ]);

    return matchOutputSchema.parse(JSON.parse(content));
  }

  async generateInterviewQuestions(input: InterviewQuestionInput): Promise<InterviewQuestionOutput> {
    const content = await this.chatCompletion([
      {
        role: 'system',
        content: buildSystemPrompt(
          `You are an interview question generator. Given a job description and a candidate's skill profile, generate relevant interview questions. Even if there are no matched skills, generate fundamental questions based on the job description to evaluate the candidate's potential.
Return a JSON object with:
- questions: array of { question: string, difficulty: "EASY" | "MEDIUM" | "HARD", category: string }`,
        ),
      },
      {
        role: 'user',
        content: wrapUserContent(JSON.stringify(input)),
      },
    ]);

    return interviewQuestionOutputSchema.parse(JSON.parse(content));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/v1/models`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
