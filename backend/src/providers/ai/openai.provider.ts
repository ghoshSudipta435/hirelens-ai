import OpenAI from 'openai';
import type { AIProvider, InterviewQuestionInput, InterviewQuestionOutput, MatchInput, MatchOutput } from './types';
import { interviewQuestionOutputSchema, matchOutputSchema, skillsOutputSchema } from './schemas';
import { buildSystemPrompt, wrapUserContent } from './prompt-builder';
import { withRetry } from './retry';

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async extractSkillsFromText(text: string): Promise<string[]> {
    const response = await withRetry((signal) =>
      this.client.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: buildSystemPrompt(
                'You are a skill extraction assistant. Extract a list of technical and professional skills from the given text. Return only a JSON object with a "skills" array of strings.',
              ),
            },
            { role: 'user', content: wrapUserContent(text) },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 500,
        },
        { signal },
      ),
    );

    const content = response.choices[0]?.message?.content ?? '{"skills": []}';
    const parsed = skillsOutputSchema.parse(JSON.parse(content));

    return parsed.skills;
  }

  async generateMatchScore(input: MatchInput): Promise<MatchOutput> {
    const response = await withRetry((signal) =>
      this.client.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [
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
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 1000,
        },
        { signal },
      ),
    );

    const content = response.choices[0]?.message?.content ?? '{}';
    return matchOutputSchema.parse(JSON.parse(content));
  }

  async generateInterviewQuestions(input: InterviewQuestionInput): Promise<InterviewQuestionOutput> {
    const response = await withRetry((signal) =>
      this.client.chat.completions.create(
        {
          model: 'gpt-4o-mini',
          messages: [
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
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 1500,
        },
        { signal },
      ),
    );

    const content = response.choices[0]?.message?.content ?? '{}';
    return interviewQuestionOutputSchema.parse(JSON.parse(content));
  }
}
