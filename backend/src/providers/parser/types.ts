export type ParsedResume = {
  rawText: string;
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

export interface ResumeParser {
  parse(buffer: Buffer, mimeType: string): Promise<ParsedResume>;
}
