import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { AIProvider, InterviewQuestionInput, InterviewQuestionOutput, MatchInput, MatchOutput } from '../types';
import { interviewQuestionOutputSchema, matchOutputSchema, skillsOutputSchema } from '../schemas';
import { buildSystemPrompt, wrapUserContent } from '../prompt-builder';
import { withRetry } from '../retry';
import { createCircuitBreaker } from '../../../utils/circuit-breaker';
import type CircuitBreaker from 'opossum';

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

    this.generateContentCb = createCircuitBreaker(
      async (systemPrompt: string, userContent: string, temperature = 0.3) => {
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
      },
      {
        name: 'GeminiProvider',
        timeout: 35000,
        errorThresholdPercentage: 50,
      }
    );

    this.generateContentCb.fallback(() => {
      throw new Error('AI Provider is currently unavailable due to high error rates.');
    });
  }

  private generateContentCb: CircuitBreaker<[string, string, number?], string>;

  private async generateContent(
    systemPrompt: string,
    userContent: string,
    temperature = 0.3,
  ): Promise<string> {
    return this.generateContentCb.fire(systemPrompt, userContent, temperature);
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
        `You are a Senior Staff Software Engineer and an expert technical interviewer. 
Given a job description and a candidate's skill profile, generate highly specific, highly technical interview questions. 

ABSOLUTE RESTRICTIONS (YOU MUST FOLLOW THESE OR FAIL):
1. NO generic behavioral questions (e.g., "Tell me about a time...", "Describe a challenging project", "What is your greatest strength").
2. NO general experience questions (e.g., "Can you describe your experience and how it relates to this role?").
3. DO NOT ask about general soft skills, adaptability, or time management.

MANDATORY REQUIREMENTS:
1. Focus STRICTLY on deep technical knowledge, system design, architectural trade-offs, and practical edge-case scenarios related to the EXACT tools, languages, and frameworks mentioned in the job description.
2. Every question must be deeply tailored to the candidate's matched and missing skills.
3. Ask about code-level specifics, framework internals, or architectural patterns.
4. If the job requires a specific technology, ask a highly specific question about it.

Return a JSON object with:
- questions: array of { question: string, difficulty: "EASY" | "MEDIUM" | "HARD", category: string }`,
      ),
      wrapUserContent(JSON.stringify(input)),
      0.7,
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
