import type { AIProvider, InterviewQuestionInput, InterviewQuestionOutput, MatchInput, MatchOutput } from '../types';
import { interviewQuestionOutputSchema, matchOutputSchema, skillsOutputSchema } from '../schemas';
import { buildSystemPrompt, wrapUserContent } from '../prompt-builder';
import { withRetry } from '../retry';

type OllamaConfig = {
  baseUrl: string;
  model: string;
};

export class OllamaProvider implements AIProvider {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: OllamaConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.model = config.model;
  }

  private async chatCompletion(messages: { role: string; content: string }[]): Promise<string> {
    const response = await withRetry(async (signal) => {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          format: 'json',
        }),
        signal,
      });

      if (!res.ok) {
        throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json() as { message?: { content?: string } };
      return data.message?.content ?? '{}';
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
          `You are an interview question generator. Given a job description and a candidate's skill profile, generate relevant interview questions.
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
      const res = await fetch(`${this.baseUrl}/api/tags`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
