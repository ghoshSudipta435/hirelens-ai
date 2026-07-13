export type ResumeParsedData = {
  skills: string[];
  experience: {
    title: string;
    company: string;
    duration: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  summary: string;
};

export type MatchInput = {
  resumeSkills: string[];
  jobSkills: string[];
  resumeText: string;
  jobDescription: string;
};

export type MatchOutput = {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
};

export type InterviewQuestionInput = {
  jobTitle: string;
  jobDescription: string;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
};

export type InterviewQuestionOutput = {
  questions: {
    question: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    category: string;
  }[];
};

export interface AIProvider {
  extractSkillsFromText(text: string): Promise<string[]>;
  generateMatchScore(input: MatchInput): Promise<MatchOutput>;
  generateInterviewQuestions(input: InterviewQuestionInput): Promise<InterviewQuestionOutput>;
}
