import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { AIProvider, InterviewQuestionInput, InterviewQuestionOutput, MatchInput, MatchOutput } from '../types';
import { interviewQuestionOutputSchema, matchOutputSchema, skillsOutputSchema } from '../schemas';
import { buildSystemPrompt, wrapUserContent } from '../prompt-builder';
import { withRetry } from '../retry';

type GeminiConfig = {
  apiKey: string;
  model?: string;
};

export class GeminiProvider implements AIProvider {
  private readonly model: GenerativeModel;

  constructor(config: GeminiConfig) {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = genAI.getGenerativeModel({
      model: config.model ?? 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
  }

  private async generateContent(
    systemPrompt: string,
    userContent: string,
    temperature = 0.3,
  ): Promise<string> {
    return withRetry(async (signal) => {
      const result = await this.model.generateContent(
        {
          systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userContent }] }],
          generationConfig: { temperature },
        },
        { signal },
      );
      return result.response.text();
    });
  }

  async extractSkillsFromText(text: string): Promise<string[]> {
    const content = await this.generateContent(
      buildSystemPrompt(
        'You are a skill extraction assistant. Extract a list of technical and professional skills from the given text. Return only a JSON object with a "skills" array of strings.',
      ),
      wrapUserContent(text),
    );

    const parsed = skillsOutputSchema.parse(JSON.parse(content));
    return parsed.skills;
  }

  async generateMatchScore(input: MatchInput): Promise<MatchOutput> {
    const content = await this.generateContent(
      buildSystemPrompt(
        `You are a resume-job matching assistant. Analyze the match between a resume and a job description.
Return a JSON object with:
- score: integer 0-100
- matchedSkills: array of skills present in both
- missingSkills: array of skills required by the job but not found in resume
- strengths: array of strong points from the resume relevant to the job`,
      ),
      wrapUserContent(
        JSON.stringify({
          resumeSkills: input.resumeSkills,
          jobSkills: input.jobSkills,
          resumeText: input.resumeText,
          jobDescription: input.jobDescription,
        }),
      ),
    );

    return matchOutputSchema.parse(JSON.parse(content));
  }

  async generateInterviewQuestions(input: InterviewQuestionInput): Promise<InterviewQuestionOutput> {
    const content = await this.generateContent(
      buildSystemPrompt(
        `You are an interview question generator. Given a job description and a candidate's skill profile, generate relevant interview questions. Even if there are no matched skills, generate fundamental questions based on the job description to evaluate the candidate's potential.
Return a JSON object with:
- questions: array of { question: string, difficulty: "EASY" | "MEDIUM" | "HARD", category: string }`,
      ),
      wrapUserContent(JSON.stringify(input)),
      0.5,
    );

    return interviewQuestionOutputSchema.parse(JSON.parse(content));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('ping');
      return result.response.text().length > 0;
    } catch {
      return false;
    }
  }
}
